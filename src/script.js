const zoomLevel = 19;
const longitude = 7.659205809165379, latitude = 45.06507115440553;
var map;


var pathLayers = [];

var MapLayers = [
    { name: 'map 0', url: '../src/geojson/maps/classrooms_t_i.geojson' },
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
    "Upstairs": 244,
    "central te": 5077,
    "central 04": 3766,
    "central 02": 3303
}

var tileLayer;

function init(){
    map = L.map('map').setView([latitude, longitude], zoomLevel);
    /*L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22
    }).addTo(map);*/

    map.on('zoomend', function() {
        map.eachLayer(function(layer) {
            if (layer instanceof L.GeoJSON && layer.options.pane == "mapPane") {
                layer.setStyle(styleMapFeatures);
            }else if(layer instanceof L.PolylineDecorator){
                layer.options.patterns[0].symbol.options.pixelSize = 12 - (zoomLevel - map.getZoom()) * 3;
            }
        });

        updateButtonStyle();
    });

    tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        maxZoom: 23,
        minZoom: 16
    }).addTo(map);

    // Create custom panes
    map.createPane('mapPane');
    map.getPane('mapPane').style.zIndex = 400;

    map.createPane('pathPane');
    map.getPane('pathPane').style.zIndex = 500;

    map.createPane('buttonPane');
    map.getPane('buttonPane').style.zIndex = 600;

    var select = document.getElementById("floor");
    select.addEventListener("change", updateLayers);

    //updateMapLayers();
    updateMapLayers();
    initDropdown();


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
    const buttons = document.getElementsByClassName("change-floor");

    const zoom = map.getZoom();
    const pixelSize = defaultSize - (defaultZoom - zoom) * 5;

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.width = pixelSize + 'px';
        buttons[i].style.height = pixelSize + 'px';
        buttons[i].style.opacity = zoom <= 18 ? 0 : 1;
    }
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
        color: '#948981',
        fillOpacity: 0.3,
        //weight: max((map.getZoom() - 18), 0)
        weight: setWeight()
    };
    let category = feature.properties.category_it;
    if(category == null){
        return style
    }
    if(isLearningSpace(category)){
        style.color = '#FFFF36';
        //style.color = '#FF9358';
        return style;
    }
    if(category.includes("Corridoio") || category.includes('Atrio') || category.includes('Cortile')){
        style.color = '#BDB7AC';
        return style;
    }
    if(isUtility(category)){
        style.color = '#9F29FF';
        return style;
    }
    if(isFoodAndRelaxation(category)){
        style.color = '#BDDE00';
        return style;
    }
    if(isInfo(category)){
        style.color = '#1A5EDC';
        return style;
    }
    if(isToilet(category)){
        style.color = '#F2A7B1'
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


    style.fillOpacity = 0.5
    return style;
}

function isLearningSpace(category){
    category = category.toLowerCase();
    if(category.includes('aula') || (category.includes('laboratori') && !category.includes('ricerca')) || category.includes('sala studio')){
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
    var filteredGeoJson = {
        type: 'FeatureCollection',
        features: filteredFeatures
    };
    return filteredGeoJson;
}

function updateLayers() {
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
    map.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON && layer.options.pane == "mapPane") {
            map.removeLayer(layer);
        }
    });

    MapLayers.forEach(function(layer) {
        fetch(layer.url)
        .then(response => response.json())
        .then(data => {
            var filteredGeoJson = filterByFloor(data.features);
            L.geoJSON(filteredGeoJson, {style: styleMapFeatures, pane: 'mapPane'}).addTo(map);
        });
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

    pathLayers.forEach(function(layer) {
        fetch(layer.url)
        .then(response => response.json())
        .then(data => {
            var pathStyle = { color: '#FF9358' };
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
                                pathOptions: { color: '#FF9358', fillOpacity: 1, weight: 2, pane: 'pathPane' }
                            })
                        }]
                    }).addTo(map);
                    //dec.options.patterns[0].symbol.options.pixelSize = 50;
                }
                i++;
            });
        });
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
                    return L.marker(latlng, { icon: icon });    
                },
                style: styleMapFeatures, 
                pane: 'buttonPane'
            }).addTo(map);
        });
    });
}


function runPython(functionName, args) {
    return fetch('/api/run-python', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ functionName, args })
    })
    .then(response => response.json())
    .then(data => data.result);
}

async function findPath(){

    var sourceName = document.getElementById("sourceInput").value;
    var targetName = document.getElementById("targetInput").value;

    var sourceId = data[sourceName];
    targetId = data[targetName];

    var select = document.getElementById("accessibility");
    var accessibility = select.selectedIndex;
    
    out = await runPython("findPath", [sourceId, targetId, accessibility]);
    if(out == 'false'){
        return;
    }
    out = out.split('),');
    startingPoint = out[0].replace(/[(]/g, '').split(', ');
    startingFloor = out[1].replace(/[( ')]/g, '');
    console.log(startingFloor, startingPoint);
    if(getFloorNumber(startingFloor) != null){
        console.log("success");
        if(pathLayers.length == 0){
            pathLayers.push({name: 'path', url: '../src/geojson/paths/shortest_path.geojson'});
            buttonLayers.push({name: 'buttons', url: '../src/geojson/paths/buttons.geojson'})
        }
        goToFloor(startingFloor);
        updatePathLayers();
        steps.stepIndex = 0;
        steps.stepList = [];
        await makeSteps({floor: startingFloor, position: [startingPoint[1], startingPoint[0]]}, '../src/geojson/paths/buttons.geojson');
        await removeStepButtons();
        steps.instructions = createStepInstructions((await (await fetch('../src/geojson/paths/shortest_path.geojson')).json()).features);
        console.log(steps);
        //await new Promise(resolve => setTimeout(resolve, 2000));
        if(steps.stepList.length > 1){
            spawnStepButtonsAndInstruction();
        }
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

function spawnStepButtonsAndInstruction(){
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

    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = steps.instructions[0];
    divInstruction.style.border = 'solid 3px';
    divInstruction.style.padding = '5px 10px';

    buttonDiv.parentElement.style.width = (buttonDiv.offsetWidth)*1.5 + 'px';
}

async function removeStepButtons(){
    var buttonDiv = document.getElementsByClassName("map-buttons")[0];
    buttonDiv.innerHTML = '';
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
    for(let i = 0; i < features.length; i++){
        var feature = features[i];
        var coordinates = feature.geometry.coordinates;
        if(feature.properties.floor_id.includes('_')){
            console.log("distance stair/elevator: ", distanceMeters(coordinates[0], coordinates[1]));
            var string = "Walk for " + distance.toFixed(0) + " meters, then take the " + getStairsOrElevator(coordinates) + " and go to " + floorToString(features[i + 1].properties.floor_id);
            instructions.push(string);
            distance = 0;
        }else{
            distance += distanceMeters(coordinates[0], coordinates[1]);
        }
    }
    var string = "Walk for " + distance.toFixed(0) + " meters";
    instructions.push(string);
    console.log(instructions);
    return instructions;
}

init();