/**
 * Let's assume there are multiple boxes
 * Select boxes of n length
 * We want to write a function that works through n length of select boxes
 * and adds options to n length of lists passed into it
 * 
 * We want to write a function for the length so that it will pass 
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
        'I am being bullied' : 'Bullying data',
        'Test' : 'Test data',
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
 * This is a help function for the starting Select Box.
 */
function removeInitialOptions(allSelectBoxes) {
    for (var i = 0; i < allSelectBoxes.length; i++ ) {
        while (allSelectBoxes[i].firstChild) {
            allSelectBoxes[i].removeChild(allSelectBoxes[i].firstChild)
        }
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
    console.log(fileLocation);
})