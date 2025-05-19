const zoomLevel = 20;
const longitude = 7.659205809165379, latitude = 45.06507115440553;
var map;
var prevZoom = 20;
var layerUrl;
var sourceId, targetId;

var pathLayers = [];

var MapLayers = [
    { name: 'map 0', url: '../src/geojson/maps/classrooms_t_i_copy.geojson' },
    { name: 'map 1', url: '../src/geojson/maps/rooms_central_site.geojson' }
];

var buttonLayers = []

var steps = {stepIndex: 0, stepList: []};

var mapFloor = {
    '-2': "XS02",
    '-1': "XS01",
    '0': "XPTE",
    '1': "XP01",
    '2': "XP02",
    '3': "XP03",
    '4': "XP04",
    '5': "XP05"
}

var data = {
    "Entrance to Classrooms T": 1127,
    "Laib 1T": 1798,
    "Classroom 5T": 861,
    "Classroom 7T": 1727,
    "Classroom 9T": 868,
    "Classroom 11T": 1281,
    "Classroom 4T": 1717,
    "Upstairs": 244
}

var colors = {
    purple: '#A029FF',
    blue: '#1A5EDB',
    yellow: '#F4BA19',
    green: '#33BF9E',
    red: '#D4121B',
    gray: '#5E768B',
    orangered: '#E65417'
}

/*
"central te": 5077,
    "central 04": 3766,
    "central 02": 3303
*/

var tileLayer;

function init(){
    function setPanes(){
         // Create custom panes
        map.createPane('basePane');
        map.getPane('basePane').style.zIndex = 200;
        
        map.createPane('mapPane');
        map.getPane('mapPane').style.zIndex = 300;

        map.createPane('iconPane');
        map.getPane('iconPane').style.zIndex = 400;

        map.createPane('pathPane');
        map.getPane('pathPane').style.zIndex = 500;

        map.createPane('buttonPane');
        map.getPane('buttonPane').style.zIndex = 600;
    }

    window.addEventListener('load', () => {console.log('caricaa');});

    var mainContainer = document.getElementsByClassName('main-container')[0];
    mainContainer.style.width = mainContainer.offsetHeight * 9 / 19 + 'px';

    var mapDiv = document.getElementById('map');
    //mapDiv.style.maxHeight = mainContainer.offsetHeight * 0.5 + 'px';
    mapDiv.style.height = '70dvh'

    if(localStorage.getItem('findPath') == 1){
        var accessibility = localStorage.getItem('accessibility');
        findPath(accessibility);
    }

    localStorage.setItem('findPath', 0);

    map = L.map('map').setView([latitude, longitude], zoomLevel);
    /*L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22
    }).addTo(map);*/

    setPanes();

    map.on('zoomend', function() {
        if(map.getZoom() == 17){
            removeAllLayers();
            fetch('../src/geojson/maps/generic_areas.geojson')
            .then(response => response.json())
            .then(data =>{
                L.geoJSON(data, {style: styleMapFeatures, pane: 'mapPane'}).addTo(map);
                var labels = [];
                for(var feature of data.features){
                    var label = getCenterFeature(feature.geometry.coordinates[0]);
                    label.properties.icon = {
                        html: `<div class="labels" style="width: 150px"><span style="font-size: 1rem;"><b>${feature.properties.room_name_en}</b></span></div>`,
                        className: 'change-floor'
                    }
                    labels.push(label);
                }
                var labelsGeojson = {
                    type: "FeatureCollection",
                    features: labels
                }
                L.geoJSON(labelsGeojson, {
                    pointToLayer: function (feature, latlng) {
                        var icon = L.divIcon({
                            html: feature.properties.icon.html,
                            className: '',
                            iconSize: [0, 0]
                        });
                        return L.marker(latlng, { icon: icon, pane: 'iconPane'});    
                    },
                    style: styleMapFeatures, 
                    pane: 'iconPane'
                }).addTo(map);
            });
            prevZoom = map.getZoom();
            return;
        }else if(map.getZoom() == 18 && prevZoom == 17){
            console.log("layers");
            removeAllLayers();
            updateLayers();
        }
        map.eachLayer(function(layer) {
            if (layer instanceof L.GeoJSON && layer.options.pane == "mapPane") {
                layer.setStyle(styleMapFeatures);
            }else if(layer instanceof L.PolylineDecorator){
                layer.options.patterns[0].symbol.options.pixelSize = 12 - (zoomLevel - map.getZoom()) * 3;
            }
        });

        updateButtonStyle();
        prevZoom = map.getZoom();
    });


    var layerUrl1 = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
    layerUrl = 'https://app.didattica.polito.it/tiles/int-light-xpte/{z}/{x}/{y}.png';

    tileLayer = L.tileLayer(layerUrl1, {
        maxZoom: 23,
        minZoom: 16, 
    }).addTo(map);
    tileLayer = L.tileLayer(layerUrl, {
        maxZoom: 23,
        minZoom: 16, 
        pane: 'basePane'
    }).addTo(map);

    var select = document.getElementById("floor");
    select.addEventListener("change", updateLayers);

    //updateMapLayers();
    updateLayers();

    //initDropdown();
    
    return;
}

function max(a, b){
    if(a <= b){
        return b;
    }
    return a;
}

function updateButtonStyle(){
    const defaultZoom = 21;
    const defaultSize = 30;
    var buttons = document.getElementsByClassName("change-floor");

    const zoom = map.getZoom();
    var pixelSize = defaultSize - (defaultZoom - zoom) * 5;

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.width = pixelSize + 'px';
        buttons[i].style.height = pixelSize + 'px';
        buttons[i].style.opacity = zoom <= 18 ? 0 : 1;
    }

    buttons = document.getElementsByClassName("destination-div");

    pixelSize = defaultSize - (defaultZoom - zoom) * 5 + 10;

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.width = pixelSize + 'px';
        buttons[i].style.height = pixelSize + 'px';
    }

    buttons = document.getElementsByClassName("icon-div");

    pixelSize = defaultSize - (defaultZoom - zoom) * 8 + 10;

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.width = pixelSize + 'px';
        buttons[i].style.height = pixelSize + 'px';
        buttons[i].parentElement.style.opacity = zoom <= 18 ? 0 : 1;
        //buttons[i].style.display = zoom <= 19 ? 'none' : '';
        if(!buttons[i].parentElement.children[1]){
            continue;
        }
        buttons[i].parentElement.children[1].style.opacity = zoom <= 19 ? 0 : 1;
    }

    /*buttons = document.getElementsByClassName("shadowed-text");
    for(let i = 0; i < buttons.length; i++){
        //buttons[i].style.opacity = zoom <= 19 ? 0 : 1;
        buttons[i].style.display = zoom <= 19 ? 'none' : '';
    }*/
}

function setWeight(){
    const zoomLevel = map.getZoom();
    if(zoomLevel >= 20){
        return 2;
    }
    return Math.pow(2, zoomLevel - 19);
}

function styleMapFeatures(feature){
    var style = {
        color: colors.gray,
        fillOpacity: 0.5,
        //weight: max((map.getZoom() - 18), 0)
        //weight: setWeight()
        weight: 0
    };
    let category = feature.properties.category_it;
    if(category == null){
        return style
    }
    category = category.toLowerCase();
    if(isLearningSpace(category)){
        style.color = '#FFFF36';
        style.color = colors.yellow;
        return style;
    }
    if(category.includes("Corridoio") || category.includes('Atrio') || category.includes('Cortile')){
        style.color = '#BDB7AC';
        return style;
    }
    if(isUtility(category)){
        style.color = '#9F29FF';
        style.color = colors.purple;
        return style;
    }
    if(isFoodAndRelaxation(category)){
        style.color = '#BDDE00';
        style.color = colors.green;
        return style;
    }
    if(isInfo(category)){
        style.color = '#1A5EDC';
        style.color = colors.blue;
        return style;
    }
    if(isToilet(category)){
        style.color = '#F2A7B1';
        style.color = colors.green;
        return style;
    }
    /*else if(category.includes("bagno")){
        style.color = '#16A34A';
    }*/
    /*else if(category.includes("Scala") || category.includes("Ascensore")){
        style.color = '#E6E801';
    }*/
    /*else if (category.includes("Siepe") || category.includes("Aiuola")){
        style.color = '#BDDE00';
    }*/


    style.fillOpacity = 0.6;
    return style;
}

function isLearningSpace(category){
    category = category.toLowerCase();
    if(category.includes('aula') || (category.includes('laboratori') && !category.includes('ricerca')) || category.includes('sala studio') || category.includes('classi')){
        return true;
    }
    return false;
}
function isUtility(category){
    category = category.toLowerCase();
    if(category.includes('scala') || category.includes('ascensore') || category.includes('fontanella')){
        return true;
    }
    return false;
}
function isFoodAndRelaxation(category){
    category = category.toLowerCase();
    if(category.includes('mensa') || category.includes('ristorazione')){
        return true;
    }
    return false;
}
function isInfo(category){
    category = category.toLowerCase();
    if(category.includes('ufficio') || category.includes('ricerca') || category.includes('riunioni')){
        return true;
    }
    return false;
}
function isToilet(category){
    category = category.toLowerCase();
    if(category.includes('bagno') || category.includes('igien')){
        return true;
    }
    return false;
}

    

function getFloor(){
    var select = document.getElementById("floor");
    var floor = select.options[select.selectedIndex].value;
    return floor;
}

function filterByFloor(features){
    var floor = getFloor();
    var filteredFeatures = features.filter(function(feature) {
        return feature.properties.floor_id === mapFloor[floor];
    });
    /*filteredFeatures = filteredFeatures.filter(function(feature) {
        var category = feature.properties.category_it;
        if(category == null){
            return true;
        }
        category = category.toLowerCase();
        return !category.includes('antibagno') && !category.includes('igien');
    });*/
    var filteredGeoJson = {
        type: 'FeatureCollection',
        features: filteredFeatures
    };
    return filteredGeoJson;
}

function updateLayers() {
    if(map.getZoom() <= 17){
        return;
    }
    updateMapLayers();
    updatePathLayers();
    map.on('layeradd', function(e) {
        if (e.layer instanceof L.Marker) {
            updateButtonStyle();
            return;
        }
    });
}

function updateMapLayers(){
    var floor = getFloor();
    map.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON && (layer.options.pane == "mapPane" || layer.options.pane == 'iconPane')) {
            map.removeLayer(layer);
        }else if(layer.options.pane == 'basePane'){
            map.removeLayer(layer);
        }
    });

    if(floor == 0){
        layerUrl = 'https://app.didattica.polito.it/tiles/int-light-xpte/{z}/{x}/{y}.png';
        tileLayer = L.tileLayer(layerUrl, {
            maxZoom: 23,
            minZoom: 16, 
            pane: 'basePane'
        }).addTo(map);
    }else if(floor == -1){
        layerUrl = 'https://app.didattica.polito.it/tiles/int-light-xs01/{z}/{x}/{y}.png';
        tileLayer = L.tileLayer(layerUrl, {
            maxZoom: 23,
            minZoom: 16, 
            pane: 'basePane'
        }).addTo(map);
    }

    MapLayers.forEach(function(layer) {
        fetch(layer.url)
        .then(response => response.json())
        .then(data => {
            var filteredGeoJson = filterByFloor(data.features);
            //L.geoJSON(filteredGeoJson, {style: {color: 'white', weight: 0, fillOpacity: 1}, pane: 'basePane'}).addTo(map);
            L.geoJSON(filteredGeoJson, {style: styleMapFeatures, pane: 'mapPane',  /*onEachFeature: function (feature, layer) {
                layer.on('click', function (e) {
                layer.setStyle({
                    fillColor: 'orange', // new fill color on click
                    color: 'red'         // new border color on click
                });
                });
            }*/}).addTo(map);
            
            var icons = [];
            var flag = false;
            for(let i = 0; i < filteredGeoJson.features.length; i++){
                var feature = filteredGeoJson.features[i];
                var category = feature.properties.category_it;
                if(category == null){ continue; }
                var iconFile = '';
                category = category.toLowerCase();
                var textColor = colors.gray;
                var applyText = false;
                if(isLearningSpace(category)){
                    flag = true;
                    textColor = colors.yellow;
                    applyText = true;
                    if(category.includes('aula')){
                        iconFile = 'classroom_icon.svg';
                    }else if(category.includes('laboratori')){
                        iconFile = 'laib_icon.svg';
                    }else if(category.includes('sala studio')){
                        iconFile = 'study_room_icon.svg';
                    }
                }else if(isUtility(category)){
                    flag = true;
                    textColor = colors.purple;
                    if(category.includes('scala')){
                        iconFile = 'stairs_icon.svg';
                    }else if(category.includes('ascensore')){
                        iconFile = 'elevator_icon.svg';
                    }else if(category.includes('fontanella')){
                        applyText = true;
                        iconFile = 'water_point_icon.svg';
                    }
                }else if(isFoodAndRelaxation(category)){
                    flag = true;
                    textColor = colors.green;
                    applyText = true;
                    if(category.includes('mensa')){
                        iconFile = 'food_icon.svg';
                    }
                }else if(isToilet(category)){
                    flag = true;
                    textColor = colors.green;
                    if(category.includes('antibagno ')){
                        iconFile = 'toilets_icon.svg';
                        //iconFile = '';
                    }else if(category == 'bagno'){
                        iconFile = 'toilets_icon.svg'
                        applyText = true;
                    }
                }
                if(iconFile == ''){
                    continue;
                }
                flag = false;
                var icon = getCenterFeature(feature.geometry.coordinates[0]);
                icon.properties.icon = {
                    html: `<div class="icon-div" style="background-color: white; transform: translate(-50%, -50%);"><img src="../src/img/Icons/${iconFile}" class="icon"></img><div></div></div>`,
                    className: 'change-floor'
                }
                var name = '';
                if(applyText == true){
                    name = feature.properties.room_name_en;
                    if(name == null || name.length > 15){ 
                        name = feature.properties.category_en;
                        if(name == null){
                            name = feature.properties.category_it;
                            if(name == null){
                                name = '';
                            }
                        }
                    }
                }
                if(name != ''){
                    name = formatName(name);
                    icon.properties.icon.html = `<div class="icon-wrap" id="icon${i}" style="background-color: #F4BA1960; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%)">
                        <div class="icon-div" style="border: none; background-color: white; transform: translate(-0%, -0%);">
                            <img src="../src/img/Icons/${iconFile}" class="icon"></img>
                        </div>
                        <div style="width: 150px; text-align: center;"><span class="shadowed-text" style="border: none; color: ${textColor};">${name}</span></div>
                    </div>`;
                }
                /*icon.properties.icon.html = `<div class="icon-wrap" id="icon${i}" style="background-color: #F4BA1960; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%)">
                    <div class="icon-div" style="border: none; background-color: white; transform: translate(-0%, -0%);">
                        <img src="../src/img/Icons/${iconFile}" class="icon"></img>
                    </div>
                    <div style="width: 100px; display: inline; justify-content: center;"><span class="shadowed-text" style="border: none; color: ${textColor};">${name}</span></div>
                </div>`;*/

                icon.properties.floor_id = feature.properties.floor_id;
                icons.push(icon);
            }
            var iconGeojson = {
                type: "FeatureCollection",
                features: icons
            }
            L.geoJSON(iconGeojson, {
                pointToLayer: function (feature, latlng) {
                    var icon = L.divIcon({
                        html: feature.properties.icon.html,
                        className: '',
                        iconSize: [0, 0]
                    });
                    return L.marker(latlng, { icon: icon, pane: 'iconPane' });    
                },
                style: styleMapFeatures, 
                pane: 'iconPane'
            }).addTo(map);

            for(let i = 0; i < filteredGeoJson.features.length; i++){
                var div = document.getElementById(`icon${i}`);
                if(div == null){
                    continue;
                }
                var divHeight = div.offsetHeight;
                var iconHeight = div.children[0].offsetHeight;
                var percent = (iconHeight / 2) / divHeight * 100;
                div.style.transform = `translate(-50%, -${percent}%)`;
            }
        });
    });

    //addIcons();

}

function formatName(name){
    function isDigit(char){
        return char >= 0 && char <= 9;
    }

    if(name.length == 0){
        return name;
    }

    name = name.toLowerCase();
    name = name[0].toUpperCase() + name.slice(1);

    var chars = name.split('')
    for(let i = 0; i < chars.length - 1; i++){
        if(isDigit(chars[i]) || chars[i] == ' '){

            chars[i + 1] = chars[i + 1].toUpperCase();
        }
    }
    return chars.join('');
}


function removeAllLayers(){
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON || layer instanceof L.PolylineDecorator) {
            map.removeLayer(layer);
        }
    });
}

function updatePathLayers(floor){
    var floor = getFloor();

    map.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON && (layer.options.pane == "pathPane" || layer.options.pane == "buttonPane")) {
            map.removeLayer(layer);
        }else if (layer instanceof L.PolylineDecorator) {
            map.removeLayer(layer);  // Remove the polyline decorator (arrow)
        }
    });

    buttonLayers.forEach(function(layer) {
        fetch(layer.url)
        .then(response => response.json())
        .then(data => {
            var filteredGeoJson = filterByFloor(data.features);
            L.geoJSON(filteredGeoJson, {
                pointToLayer: function (feature, latlng) {
                    var icon = L.divIcon({
                        html: feature.properties.icon.html,
                        className: '', //feature.properties.icon.className,
                        iconSize: [0, 0]
                    });
                    return L.marker(latlng, { icon: icon , pane: 'buttonPane'});    
                },
                style: styleMapFeatures, 
                pane: 'buttonPane'
            }).addTo(map);
        });
    });

    pathLayers.forEach(function(layer) {
        fetch(layer.url)
        .then(response => response.json())
        .then(data => {
            var pathStyle = { color: colors.orangered };
            var filtered = filterByFloor(data.features);
            var line = L.geoJSON(filtered, {style: pathStyle, pane: 'pathPane'}).addTo(map);
            var i = 0;
            line.eachLayer(function(layer) {
                if (layer instanceof L.Polyline && i % 3 == 1) {
                    var dec = L.polylineDecorator(layer, {
                        patterns: [{
                            offset: '50%',
                            repeat: 0, // try '10%' if you want repeated arrows
                            symbol: L.Symbol.arrowHead({
                                pixelSize: 12,
                                polygon: true,
                                pathOptions: { color: colors.orangered, fillOpacity: 1, weight: 2, pane: 'pathPane' }
                            })
                        }]
                    }).addTo(map);
                    //dec.options.patterns[0].symbol.options.pixelSize = 50;
                }
                i++;
            });
        });
    });

}


async function findPathPython(args) {
    return fetch('/api/run-python', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ args })
    })
    .then(response => response.json())
    .then(data => data.result);
}

async function findPath(accessibility){
    sourceId = localStorage.getItem('sourceId');
    targetId = localStorage.getItem('targetId');

    /*var sourceName = document.getElementById("sourceInput").value;
    var targetName = document.getElementById("targetInput").value;

    var sourceId = data[sourceName];
    targetId = data[targetName];*/

    /*var select = document.getElementById("accessibility");
    console.log(+document.getElementById('checkbox').checked);
    var accessibility = select.selectedIndex;*/
    //var accessibility = +document.getElementById('checkbox').checked;
    
    out = await findPathPython([sourceId, targetId, accessibility]);
    console.log(out);
    if(out == 'false'){
        return;
    }
    /*out = out.split('),');
    startingPoint = out[0].replace(/[(]/g, '').split(', ');
    startingFloor = out[1].replace(/[( ')]/g, '');*/
    startingPoint = out[0];
    startingFloor = out[1];
    if(getFloorNumber(startingFloor) != null){
        console.log("success");
        if(pathLayers.length == 0){
            pathLayers.push({name: 'path', url: '../src/geojson/paths/shortest_path.geojson'});
            buttonLayers.push({name: 'buttons', url: '../src/geojson/paths/buttons.geojson'});
            buttonLayers.push({name: 'icons', url: '../src/geojson/paths/icons.geojson'});
        }
        goToFloor(startingFloor);
        updatePathLayers();
        steps.stepIndex = 0;
        steps.stepList = [];
        await makeSteps({floor: startingFloor, position: [startingPoint[1], startingPoint[0]]}, '../src/geojson/paths/buttons.geojson');
        await removeStepButtons();
        steps.instructions = createStepInstructions((await (await fetch('../src/geojson/paths/shortest_path.geojson')).json()).features);
        //await new Promise(resolve => setTimeout(resolve, 2000));
        if(steps.stepList.length > 1){
            spawnStepButtons();
        }
        spawnInstructions();
        map.flyTo([startingPoint[1], startingPoint[0]], zoomLevel);
    }

    /*window.electron.runPython("findPath", [startId, targetId]);
    await new Promise((resolve) => {
        window.electron.onPythonResult((result) => {
            out = result
            resolve(result);
        });
    });*/
}

async function makeSteps(start, filePath){
    steps.stepList.push(start);

    const response = await fetch(filePath);
    const data = await response.json();

    for (const feature of data.features) {
        const coordinates = feature.geometry.coordinates;
        const step = {
            floor: feature.properties.to_floor,
            position: [coordinates[1], coordinates[0]]
        };
        steps.stepList.push(step);
    }
}

function toggleDropdown(id) {
    document.getElementById(id).style.display = "block";
}

function initDropdown() {
    let list = document.getElementById("names");
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var option = document.createElement("option");
            option.value = key;
            list.appendChild(option);
        }
    }
}

function clean(object){
    object.value = "";
}

function goToFloor(floor_id){
    var select = document.getElementById("floor");
    select.selectedIndex = 5 - getFloorNumber(floor_id);
    updateLayers()
}

function getFloorNumber(floor_id){
    for(var key in mapFloor){
        if(mapFloor[key] == floor_id){
            return key;
        }
    }
    return null;
}

function nextStep(){
    var i = steps.stepIndex;
    if(i == steps.stepList.length - 1){
        return;
    }
    var step = steps.stepList[i + 1];
    goToFloor(step.floor);
    map.flyTo(step.position, map.getZoom());
    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = steps.instructions[i + 1];

    steps.stepIndex++;

    if(steps.stepIndex == steps.stepList.length - 1){
        var button = document.getElementById('next-step-button');
        button.style.backgroundColor = 'gray';
        button.disabled = true;
        button.style.cursor = 'not-allowed';
    }
    var button = document.getElementById('prev-step-button');
    button.style.backgroundColor = '#FF9358';
    button.disabled = false;
    button.style.cursor = 'pointer';
}
function prevStep(){
    var i = steps.stepIndex;
    if(i == 0){
        return;
    }
    var step = steps.stepList[i - 1];
    map.flyTo(step.position, map.getZoom());
    goToFloor(step.floor);
    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = steps.instructions[i - 1];
    
    steps.stepIndex--;

    if(steps.stepIndex == 0){
        var button = document.getElementById('prev-step-button');
        button.style.backgroundColor = 'gray';
        button.disabled = true;
        button.style.cursor = 'not-allowed';
    }
    var button = document.getElementById('next-step-button');
    button.style.backgroundColor = '#FF9358';
    button.disabled = false;
    button.style.cursor = 'pointer';
    
}

function disableButton(button){
    button.style.backgroundColor = 'gray';
    button.disabled = true;
    button.style.cursor = 'not-allowed';
}
function activateButton(button){
    button.style.backgroundColor = '#FF9358';
    button.disabled = false;
    button.style.cursor = 'pointer';
}

function setStep(floor_id, stepIndex){
    goToFloor(floor_id);
    steps.stepIndex = stepIndex;

    var prevButton = document.getElementById('prev-step-button');
    var nextButton = document.getElementById('next-step-button');

    activateButton(prevButton);
    activateButton(nextButton);

    if(steps.stepIndex == 0){
        disableButton(prevButton);
    }else if(steps.stepIndex == steps.stepList.length - 1){
        disableButton(nextButton);
    }

    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = steps.instructions[stepIndex];
    
}

function spawnStepButtons(){
    var buttonDiv = document.getElementsByClassName("map-buttons")[0];
    
    var prevButton = document.createElement('button');
    prevButton.className = 'step-button';
    prevButton.id = 'prev-step-button';
    prevButton.onclick = function(){ prevStep() };
    prevButton.textContent = 'Back';
    prevButton.style.backgroundColor = 'gray';
    prevButton.disabled = true;
    prevButton.style.cursor = 'not-allowed';

    buttonDiv.appendChild(prevButton);

    var nextButton = document.createElement('button');
    nextButton.className = 'step-button';
    nextButton.id = 'next-step-button';
    nextButton.onclick = function(){ nextStep() };
    nextButton.textContent = 'Next';

    buttonDiv.appendChild(nextButton);

    //buttonDiv.parentElement.style.width = (buttonDiv.offsetWidth)*2 + 'px';
}

function spawnInstructions(){
    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = steps.instructions[0];
    divInstruction.style.border = 'solid 3px';
    divInstruction.style.padding = '5px 10px';
}

async function removeStepButtons(){
    var buttonDiv = document.getElementsByClassName("map-buttons")[0];
    buttonDiv.innerHTML = '';
    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = '';
    divInstruction.style.border = '';
    divInstruction.style.padding = '';
}

function distanceMeters(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = angle => angle * Math.PI / 180;

    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function floorToString(floor_id){
    if(floor_id == "XPTE"){
        return 'Floor 0';
    }
    var res = 'Floor ';
    if(floor_id[1] == 'S'){
        res = res + '-';
    }
    return res + floor_id[3];
}

function createStepInstructions(features){
    function getStairsOrElevator(coordinates){
        if(distanceMeters(coordinates[0], coordinates[1]) < 0.4){
            return 'elevator';
        }
        return 'stairs';
    }

    var instructions = [];
    var distance = 0;
    var string;
    
    for(let i = 0; i < features.length; i++){
        var feature = features[i];
        var coordinates = feature.geometry.coordinates;
        if(feature.properties.floor_id.includes('_')){
            string = "Walk for " + distance.toFixed(0) + " meters, then take the " + getStairsOrElevator(coordinates) + " and go to " + floorToString(features[i + 1].properties.floor_id);
            instructions.push(string);
            distance = 0;
        }else{
            distance += distanceMeters(coordinates[0], coordinates[1]);
        }
    }
    string = "Walk for " + distance.toFixed(0) + " meters";
    instructions.push(string);
    return instructions;
}


function cleanPolygon(polygon){
    var cleaned = [];
    var l = 0;
    cleaned.push(polygon[0]);
    for(let i = 1; i < polygon.length; i++){
        if(polygon[i][0] != cleaned[l][0] || polygon[i][1] != cleaned[l][1]){
            cleaned.push(polygon[i]);
            l++;
        }
    }
    return cleaned;
}

function getRealPolygon(polygon){

    function angleBetweenThreePoints(A, B, C) {
        function vectorMagnitude(v) {
            return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        }
        function dotProduct(a, b) {
            return a.x * b.x + a.y * b.y + a.z * b.z;
        }
        function vectorSubtract(a, b) {
            return {
                x: a.x - b.x,
                y: a.y - b.y,
                z: a.z - b.z
            };
        }
        function latLonToCartesian(lonLat) {
            const [lon, lat] = lonLat;
            const latRad = toRadians(lat);
            const lonRad = toRadians(lon);
            return {
                x: Math.cos(latRad) * Math.cos(lonRad),
                y: Math.cos(latRad) * Math.sin(lonRad),
                z: Math.sin(latRad)
            };
        }
        function toRadians(degrees) {
            return degrees * Math.PI / 180;
        }
    
        const a = latLonToCartesian(A);
        const b = latLonToCartesian(B);
        const c = latLonToCartesian(C);
    
        const BA = vectorSubtract(a, b);
        const BC = vectorSubtract(c, b);
    
        const dot = dotProduct(BA, BC);
        const magBA = vectorMagnitude(BA);
        const magBC = vectorMagnitude(BC);
    
        const cosTheta = dot / (magBA * magBC);
        const angleRad = Math.acos(Math.min(Math.max(cosTheta, -1), 1)); // Clamp to [-1, 1]
        const angleDeg = angleRad * (180 / Math.PI);
    
        return angleDeg;
    }

    var realPolygon = [];
    const n = polygon.length;
    for(let i = 0; i < n; i++){
        var prev = polygon[(i - 1 + n) % n];
        var curr = polygon[i];
        var next = polygon[(i + 1) % n];
        var angle = angleBetweenThreePoints(prev, curr, next);
        if(Math.abs(angle - 180) < 1 || Math.abs(angle) < 1){
            continue;
        }
        realPolygon.push(polygon[i]);
    }
    return realPolygon;
}

function getCenterFeature(polygon){
    polygon = cleanPolygon(polygon);
    polygon = getRealPolygon(polygon);

    const poly = turf.polygon([polygon]);
    const center = turf.centerOfMass(poly);

    return center;
}

function addIcons(){
    function point(coord){
        return {type: 'Point', coordinates: coord};
    }
    var icons = [];
    var icon = {
        type: "Feature",
        geometry: point([7.6590102, 45.0651902]),
        properties: {
            floor_id: 'XPTE',
            icon: {
                html: '<div class="icon-div" style="background-color: white; transform: translate(-50%, -50%);"><img src="../src/img/Icons/classroom_icon.svg" class="icon"></img></div>',
                className: 'change-floor'
            }
        }
    }
    icons.push(icon);

    var icon = {
        type: "Feature",
        geometry: point([7.659296, 45.0650976]),
        properties: {
            floor_id: 'XPTE',
            icon: {
                html: '<div class="icon-div" style="background-color: white; transform: translate(-50%, -50%);"><img src="../src/img/Icons/elevator_icon.svg" class="icon"></img></div>',
                className: 'change-floor'
            }
        }
    }
    icons.push(icon);

    var icon = {
        type: "Feature",
        geometry: point([7.6596179, 45.0649695]),
        properties: {
            floor_id: 'XPTE',
            icon: {
                html: '<div class="icon-div" style="background-color: white; transform: translate(-50%, -50%);"><img src="../src/img/Icons/food_icon.svg" class="icon"></img></div>',
                className: 'change-floor'
            }
        }
    }
    icons.push(icon);

    var icon = {
        type: "Feature",
        geometry: point([7.6592314, 45.0652271]),
        properties: {
            floor_id: 'XPTE',
            icon: {
                html: '<div class="icon-div" style="background-color: white; transform: translate(-50%, -50%);"><img src="../src/img/Icons/toilets_icon.svg" class="icon"></img></div>',
                className: 'change-floor'
            }
        }
    }
    icons.push(icon)

    var icon = {
        type: "Feature",
        geometry: point([7.6590775, 45.0652851]),
        properties: {
            floor_id: 'XPTE',
            icon: {
                html: '<div class="icon-div" style="background-color: white; transform: translate(-50%, -50%);"><img src="../src/img/Icons/classroom_icon.svg" class="icon"></img></div>',
                className: 'change-floor'
            }
        }
    }
    icons.push(icon)

    iconGeojson = filterByFloor(icons);
    L.geoJSON(iconGeojson, {
        pointToLayer: function (feature, latlng) {
            var icon = L.divIcon({
                html: feature.properties.icon.html,
                className: '', //feature.properties.icon.className,
                iconSize: [0, 0]
            });
            return L.marker(latlng, { icon: icon });    
        },
        style: styleMapFeatures, 
        pane: 'iconPane'
    }).addTo(map);
}


function saveTargetId(targetName){
    //var targetName = document.getElementById("targetInput").value;
    targetId = data[targetName];
    localStorage.setItem('targetId', targetId);
}

function saveSourceId(sourceName){
    //var sourceName = document.getElementById("sourceInput").value;
    sourceId = data[sourceName];
    localStorage.setItem('sourceId', sourceId)
}

function advanceInput(){
    var searchInput = document.getElementsByClassName('searchInput')[0];
    if((searchInput.value in data) == false){
        var mainContainer = document.getElementsByClassName('main-container')[0];
        var message = document.createElement('div');
        message.id = 'error-input-message';
        message.textContent = 'INPUT NOT VALID, INSERT A VALID INPUT';
        message.style.color = 'red';
        mainContainer.appendChild(message);
        clean(searchInput);
        return;
    }
    if(searchInput.id == 'targetInput'){
        var targetInput = searchInput;
        saveTargetId(targetInput.value);
        clean(targetInput);
        
        targetInput.id = 'sourceInput';
        targetInput.placeholder = 'Where are you?';
        document.getElementById('inputLabel').textContent = 'Current position';
    }else{
        var sourceInput = searchInput;
        var accessibility = +document.getElementById('checkbox').checked;

        saveSourceId(sourceInput.value);
        clean(sourceInput);

        localStorage.setItem('findPath', 1);
        localStorage.setItem('accessibility', accessibility);
        window.location.href='../src/home_mobile.html';
    }
    /*var targetInput = document.getElementById("targetInput");
    saveTargetId(targetInput.value);

    clean(targetInput);
    
    targetInput.id = 'sourceInput';
    targetInput.placeholder = 'Where are you?';

    document.getElementById('inputLabel').textContent = 'Current position';

    var button = document.getElementById('nextButton');
    button.onclick = function(){goToFindPath()};*/
}

async function goToFindPath(){
    var sourceInput = document.getElementById("sourceInput");
    saveSourceId(sourceInput.value);

    clean(sourceInput);
    //await findPath(0);
    /*console.log(pathLayers);
    console.log("pathLayers before storing:", pathLayers.length); // Is this 0?
    localStorage.setItem('pathLayers', JSON.stringify(pathLayers));
    console.log(JSON.parse(localStorage.getItem('pathLayers')));
    localStorage.setItem('buttonLayers', buttonLayers);*/
    localStorage.setItem('findPath', 1);
    window.location.href='../src/home_mobile.html';
}

function initInput(){
    initDropdown();

    var mainContainer = document.getElementsByClassName('main-container')[0];
    mainContainer.style.width = mainContainer.offsetHeight * 9 / 19 + 'px';

    
    var searchInput = document.getElementsByClassName('searchInput')[0];
    searchInput.addEventListener('keydown', function(event){
        var errorMessage = document.getElementById('error-input-message');
        if(errorMessage != null){
            errorMessage.parentElement.removeChild(errorMessage);
        }
        if(event.key === 'Enter'){
            advanceInput();
        }
    })
}


//init();