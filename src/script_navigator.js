import { map, pathLayers, buttonLayers } from './script.js'
import { updateLayers, updatePathLayers, init } from './script.js';

const zoomLevel = 20;
var sourceId, targetId;

var steps = {stepIndex: 0, stepList: []};

var mapFloor = {
    '-1': "XS01",
    '0': "XPTE",
    '1': "XP01",
    '2': "XP02",
    '3': "XP03",
    '4': "XP04",
    '5': "XP05"
}


var floorName = {
    'XS01': 'Underground floor',
    'XPTE': 'Ground floor',
    'XP01': 'First floor',
    'XP02': 'Second floor',
    'XP03': 'Third floor',
    'XP04': 'Fourth floor',
    'XP05': 'Fifth floor',
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
    
    var out = await findPathPython([sourceId, targetId, accessibility]);
    console.log(out);
    if(out == 'false'){
        return;
    }

    var startingPoint = out[0];
    var startingFloor = out[1];
    var endPoint = out[2];
    var endFloor = out[3];
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
        var start = {floor: startingFloor, position: [startingPoint[1], startingPoint[0]]};
        var end = {floor: endFloor, position: [endPoint[1], endPoint[0]]};
        await makeSteps(start, end, '../src/geojson/paths/buttons.geojson');
        await removeStepButtons();
        steps.instructions = createStepInstructions((await (await fetch('../src/geojson/paths/shortest_path.geojson')).json()).features);
        if(steps.stepList.length > 1){
            spawnStepButtons();
        }
        spawnInstructions();
        map.flyTo([startingPoint[1], startingPoint[0]], zoomLevel);
    }
}

async function makeSteps(start, end, filePath){
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
    steps.stepList.push(end);
}

function goToFloor(floor_id){
    var select = document.getElementById("floor");
    select.selectedIndex = getFloorNumber(floor_id) + 1;
    updateLayers();
}

function getFloorNumber(floor_id){
    for(var key in mapFloor){
        if(mapFloor[key] == floor_id){
            return parseInt(key, 10);
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
        disableButton(button);
    }
    var button = document.getElementById('prev-step-button');
    activateButton(button);
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
        disableButton(button);
    }
    var button = document.getElementById('next-step-button');
    activateButton(button);
    
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
    disableButton(prevButton);

    buttonDiv.appendChild(prevButton);

    var nextButton = document.createElement('button');
    nextButton.className = 'step-button';
    nextButton.id = 'next-step-button';
    nextButton.onclick = function(){ nextStep() };
    nextButton.textContent = 'Next';

    buttonDiv.appendChild(nextButton);
}

function spawnInstructions(){
    var divInstruction = document.getElementById('div-instruction');
    divInstruction.textContent = steps.instructions[0];
    divInstruction.style.border = 'solid 1px';
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
            string = "Walk for " + distance.toFixed(0) + " meters, then take the " + getStairsOrElevator(coordinates) + " and go to " + floorName[features[i + 1].properties.floor_id];
            instructions.push(string);
            distance = 0;
        }else{
            distance += distanceMeters(coordinates[0], coordinates[1]);
        }
    }
    string = "Walk for " + distance.toFixed(0) + " meters";
    instructions.push(string);
    instructions.push("You arrived");
    return instructions;
}


function initNavigator(){
    init();

    var accessibility = localStorage.getItem('accessibility');
    findPath(accessibility);
}


window.addEventListener("load", initNavigator);
window.setStep = setStep;