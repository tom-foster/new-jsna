/**
 * Let's assume there are multiple boxes
 * Select boxes of n length
 * We want to write a function that works through n length of select boxes
 * and adds options to n length of lists passed into it
 * 
 * We want to write a function for the length so that it will pass 
 * through any select box
 * 
 * 
 */

// Let's select all boxes first
var selectBoxContainer = document.getElementById('selection-div');
console.log(selectBoxContainer);
var allSelectBoxes = selectBoxContainer.getElementsByTagName('select');
console.log(allSelectBoxes);

// allSelectBoxes that in the container are now selected.

//Let's define some defaults for the lists I will assume either all Lists or all objects
var areaName = ['JSNA', 'District'];
var ageGroupName = [
    {
    'Year 6' : 'Year 6',
    'Year 9' : 'Year 9',
    }
];
var academicYearName = [
    {
        "Year 2017-2018" : '2017-2018'
    }
];
var questionName = [
    {
        'hello': 'test',
    }
];

// For the n length of select boxes, add a list of options that are the list of arrays or objects
//that will populate the select box options in order.
var allSelectBoxOptions = [areaName, ageGroupName, academicYearName, questionName];

/**
 * A function that deals with an array, or array of objects
 * which is likely how the data will be presented.
 * This is a helper function to populateAllSelectBoxOptions.
 */
function objectOrArrayOfObjects(allSelectBoxesIndex, allSelectBoxOptionsIndex) {
    if (Object.prototype.toString.call(allSelectBoxOptionsIndex) === '[object Object]') {
        for (var i = 0; i < Object.keys(allSelectBoxOptionsIndex).length; i++) {
            console.log(Object.keys(allSelectBoxesIndex).length);
            var option = document.createElement('option');
            option.text = Object.keys(allSelectBoxOptionsIndex)[i];
            option.value = allSelectBoxOptionsIndex[Object.keys(allSelectBoxOptionsIndex)[i]];
            allSelectBoxesIndex.appendChild(option);
            // console.log('option text: ' + option.text + ' option value: ' + option.value);

        }
    }
}

/**
 * Takes an Index, check if it is an array and if it is populates it.
 * Adds it to the select box.
 * This is a helper function to populateAllSelectBoxOptions.
 */
function arrayOfStrings(allSelectBoxesIndex, allSelectBoxOptionsIndex) {
    if (typeof(allSelectBoxOptionsIndex) === 'string') {
        var option = document.createElement('option');
        option.text = allSelectBoxOptionsIndex;
        option.value = allSelectBoxOptionsIndex;
        allSelectBoxesIndex.appendChild(option);
    }
}

/**
 * This function populates all Select Box with Options, it takes a variable
 * that holds a HTML collection of selectBoxes
 * allSelectBox Options should be an array, of objects or arrays
 */
function populateAllSelectBoxOptions(allSelectBoxes, allSelectBoxOptions) {
    for (var i = 0; i < allSelectBoxes.length; i++) {
        var selectBox = allSelectBoxes[i];
        for (var j = 0; j < allSelectBoxOptions[i].length; j++) {
            arrayOfStrings(allSelectBoxes[i], allSelectBoxOptions[i][j]);
            objectOrArrayOfObjects(allSelectBoxes[i], allSelectBoxOptions[i][j]);
        }
    }
}

/**
 * Removes Disabled Attribute From Select Box collection.
 * */ 
function removeDisabledAttribute(allSelectBoxes) {
    for (var i = 0; i < allSelectBoxes.length; i++) {
        if (allSelectBoxes[i].hasAttribute('disabled')) {
            allSelectBoxes[i].removeAttribute('disabled');
        }
    }
}

/**
 * When passed allSelectBoxes collection, removes all childNodes of each select box
 * This is a helper function for the starting Select Box, and other selectBoxrelated ones!
 */
function removeInitialOptions(allSelectBoxes) {
    for (var i = 0; i < allSelectBoxes.length; i++ ) {
        while (allSelectBoxes[i].firstChild) {
            allSelectBoxes[i].removeChild(allSelectBoxes[i].firstChild)
        }
    }
}

/* 
This section is for the geojson layer so it loads the leaflet promise.
This is where we will need to potentially rewrite this part.

We'll come back to this function, since it's loading at the moment.

That's all we need.

Data variable still set as a global
 */

 var geoJSONLayer = L.geoJSON();

 function geoJSONLeafletPromise(url, selectBoxForProperties) {
     let geoJSONPromise = new Promise((resolve, reject) => {
         const xhr = new XMLHttpRequest();
         xhr.open('GET', url);
        //  you need to return the responseType as json.
        xhr.responseType = 'json';
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
     });

     geoJSONPromise.then(success => {
         console.log('Worked?' + success);
        //  data will be set without var for now.
         data = success;
         //we want to return all features and the properties
         // then we want to process them so that whatever nth possible stand
         geoJSONLayer = L.geoJSON(data).addTo(map);
         var newOptions = loadGeoJSONPropertiesKeys(data);
         populateSelectBox(selectBoxForProperties, newOptions);


     }).catch(
         (rejection) => {
             var geoJSONText = document.getElementById('geojson-text');
             geoJSONText.innerHTML = '<h2>Error!</h2> \
                                        <code>' + rejection + '</code>';
            console.log(rejection);
         }
     )
 }

/**
Extract all the properties from a loaded geojson.
This will make it easier to load a select box.
*/
function loadGeoJSONPropertiesKeys(data) {
    var newOptions = Object.keys(data.features[0].properties);
    return newOptions;
}


/**
 * Populate a single select box
 */
function populateSelectBox(selectBox, options) {
    removeSingleSelectBoxOptions(selectBox);
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement('option');
        option.text = options[i];
        option.valuie = options[i];
        selectBox.appendChild(option);
    }
}
/**
 * 
 * Helper function for populateSelectBox
 * 
 */
function removeSingleSelectBoxOptions(selectBox) {
    while (selectBox.firstChild) {
        selectBox.removeChild(selectBox.firstChild);
    }
}


//When the box with the 'start-here' class is selected we then want to load all the list items.
var firstSelectBox = allSelectBoxes[0];
firstSelectBox.addEventListener('change', function(e) {
    // var firstSelectBox = this.value;
    if (firstSelectBox.classList.value == 'start-here') {
        firstSelectBox.classList.remove('start-here');
        removeInitialOptions(allSelectBoxes);
        populateAllSelectBoxOptions(allSelectBoxes, allSelectBoxOptions);
        removeDisabledAttribute(allSelectBoxes);
    }
}, false);

selectBoxContainer.addEventListener('change', function(e) {
    var fileName = {};
    var fileLocation = '../data/';
    for (var i = 0; i < allSelectBoxes.length; i++) {
        fileName['key-' + i] = allSelectBoxes[i].value;
        // This needs a better function written for it.
        // Basically remove the key that you don't want to join on.
        if (!fileName['key-3']) {
            fileLocation += allSelectBoxes[i].value + ' ';
        }
    }
    fileLocation = fileLocation.slice(0, -1);
    fileLocation += '.geojson';
    console.log(Object.values(fileName));
    // Insert the geojson file here.
    console.log(fileLocation);
    // Required for the geojson
    map.removeLayer(geoJSONLayer);
    // This will need to be moved off of the current EventListener in it's current form.
    // It is currently constantly removing the options in the drop down.
    // but is close to a correct solution.
    geoJSONLeafletPromise(fileLocation, allSelectBoxes[3]);
}, false);

