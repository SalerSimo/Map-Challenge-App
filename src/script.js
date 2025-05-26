const zoomLevel = 19;
const longitude = 7.659205809165379, latitude = 45.06507115440553;
export var map;
var prevZoom = 20;
var layerUrl;

export var pathLayers = [];

export var MapLayers = [
    { name: 'map 0', url: '../src/geojson/maps/classrooms_t_i_copy.geojson' },
    { name: 'map 1', url: '../src/geojson/maps/rooms_central_site.geojson' }
];

export var buttonLayers = []

var mapFloor = {
    '-1': "XS01",
    '0': "XPTE",
    '1': "XP01",
    '2': "XP02",
    '3': "XP03",
    '4': "XP04",
    '5': "XP05"
}

export const data = {
    "Entrance to Classrooms T": 1127,
    "Entrance to Classrooms I": 638,
    "Laib 1T": 1798,
    "Classroom 5T": 861,
    "Classroom 7T": 1727,
    "Classroom 9T": 868,
    "Classroom 11T": 1281,
    "Classroom 4T": 1717,
    "Upstairs": 244,

    "Classroom 1I": 2202,
    "Classroom 7I": 2162
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

var floorName = {
    'XS01': 'Basement floor',
    'XPTE': 'Ground floor',
    'XP01': 'First floor',
    'XP02': 'Second floor',
    'XP03': 'Third floor',
    'XP04': 'Fourth floor',
    'XP05': 'Fifth floor',
}


var tileLayer;

export function init(){
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

    var selectFloor = document.getElementById('floor');
    for(var floorCode of Object.keys(floorName)){
        var option = document.createElement('option');
        option.value = Object.keys(mapFloor).find(key => mapFloor[key] == floorCode);
        option.textContent = floorName[floorCode];
        if(floorCode == 'XPTE'){
            option.selected = true;
        }
        selectFloor.appendChild(option);
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
        if(!buttons[i].parentElement.children[1]){
            continue;
        }
        buttons[i].parentElement.children[1].style.opacity = zoom <= 19 ? 0 : 1;
    }
}

function styleMapFeatures(feature){
    var style = {
        color: colors.gray,
        fillOpacity: 0.5,
        weight: 0
    };
    let category = feature.properties.category_it;
    if(category == null){
        return style
    }
    category = category.toLowerCase();
    if(isLearningSpace(category)){
        style.color = '#E6E6E6';
        style.color = colors.yellow;
        return style;
    }
    if(category.includes("corridoio") || category.includes('atrio') || category.includes('cortile')){
        style.color = '#BDB7AC';
        style.fillOpacity = 1;
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
    var filteredGeoJson = {
        type: 'FeatureCollection',
        features: filteredFeatures
    };
    return filteredGeoJson;
}

export function updateLayers() {
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

export function updateMapLayers(){
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
            L.geoJSON(filteredGeoJson, {style: styleMapFeatures, pane: 'mapPane', renderer: L.canvas({ padding: 1 })}).addTo(map);
            
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

export function updatePathLayers(){
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
                    L.polylineDecorator(layer, {
                        patterns: [{
                            offset: '50%',
                            repeat: 0,
                            symbol: L.Symbol.arrowHead({
                                pixelSize: 12,
                                polygon: true,
                                pathOptions: { color: colors.orangered, fillOpacity: 1, weight: 2, pane: 'pathPane' }
                            })
                        }]
                    }).addTo(map);
                }
                i++;
            });
        });
    });

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

window.init = init;