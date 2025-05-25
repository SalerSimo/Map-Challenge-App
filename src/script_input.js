var data = {
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

function initInput(){

    function sortKeys(obj){
        const sortedObj = Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {});
        return sortedObj;
    }

    //initDropdown();

    window.addEventListener('keydown', (event) => {
        if(event.key == 'Enter'){
            computePath();
        }
    });

    window.addEventListener('click', (event) => {
        if(event.target.id.includes('Input') == false){
            toggleDropdown(null);
        }
    });

    var dropdownSource = document.getElementById('dropdownSource');
    var dropdownTarget = document.getElementById('dropdownTarget');


    for(var key in sortKeys(data)){
        var div = document.createElement("div");
        div.className = 'dropdown-element';
        div.onclick = (function(value) {
            return function() {
                selectOption(value, 'sourceInput');
            };
        })(key);
        var img = document.createElement('img');
        img.src = '../src/img/start_position.svg';
        img.style.height = '75%';
        div.appendChild(img);
        span = document.createElement('span');
        span.textContent = key;
        div.appendChild(span);
        dropdownSource.appendChild(div);

        var div = document.createElement("div");
        div.className = 'dropdown-element';
        div.onclick = (function(value) {
            return function() {
                selectOption(value, 'targetInput');
            };
        })(key);
        var img = document.createElement('img');
        img.src = '../src/img/start_position.svg';
        img.style.height = '75%';
        div.appendChild(img);
        span = document.createElement('span');
        span.textContent = key;
        div.appendChild(span);
        dropdownTarget.appendChild(div);
    }


    
    var inputs = document.getElementsByClassName('searchInput');
    for(var input of inputs){
        input.addEventListener('click', function(event){
            var errorMessage = document.getElementById('error-input-message');
            console.log(errorMessage);
            if(errorMessage != null){
                errorMessage.parentElement.removeChild(errorMessage);
            }
        })
    }
    
}

function computePath(){
    function saveTargetId(targetName){
        targetId = data[targetName];
        localStorage.setItem('targetId', targetId);
    }
    function saveSourceId(sourceName){
        sourceId = data[sourceName];
        localStorage.setItem('sourceId', sourceId)
    }

    function checkError(input){
        if((input.value in data) == false){
            var mainContainer = document.getElementsByClassName('main-container')[0];
            var message = document.createElement('div');
            message.id = 'error-input-message';
            message.textContent = 'INPUT NOT VALID, INSERT A VALID INPUT';
            message.style.color = 'red';
            mainContainer.appendChild(message);
            clean(input);
            return true;
        }
        return false;
    }
    var sourceInput = document.getElementById('sourceInput');
    var targetInput = document.getElementById('targetInput');

    if(checkError(sourceInput) || checkError(targetInput)){
        return;
    }

    saveSourceId(sourceInput.value);
    saveTargetId(targetInput.value);

    var accessibility = +document.getElementById('checkbox').checked;

    localStorage.setItem('findPath', 1);
    localStorage.setItem('accessibility', accessibility);
    window.location.href='../src/navigator_mobile.html';
}


function toggleDropdown(id){
    var dropdowns = document.getElementsByClassName('dropdown');
    for(var dropdown of dropdowns){
        if(dropdown.id != id){
            dropdown.style.display = 'none';
        }
    }
    if(id == null){
        return;
    }
    var dropdown = document.getElementById(id);
    dropdown.style.display = 'flex';
}

function selectOption(option, id){
    document.getElementById(id).value = option;
    toggleDropdown(null);
}

function swapLocation(){
    var sourceInput = document.getElementById('sourceInput');
    var targetInput = document.getElementById('targetInput');

    var tmp = sourceInput.value;
    sourceInput.value = targetInput.value;
    targetInput.value = tmp;
}

function filterOptions(input, dropdownId) {
    var filter, div, i;
    var cnt = 0;
    filter = input.value.toUpperCase();
    div = document.getElementById(dropdownId).getElementsByTagName("div");
    for (i = 0; i < div.length; i++) {
        if (div[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
            div[i].style.display = "";
            cnt++;
        } else {
            div[i].style.display = "none";
        }
    }
}

function clean(object){
    object.value = "";
}