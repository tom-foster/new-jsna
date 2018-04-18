// This is currently a working leaflet example but it relies
// on a modern browsers. 2015 and later, since it's only internal there
//should be no problems for now.

// As long as people don't use ie11.

// Add unique extension that you want at the top.
// This is in reference to the leaflet-layers-only.js
L.control.key({ position : 'bottomleft'}).addTo(map);

//define the geojson Layer globally to begin with so that you can
//add an event listener to remove it.


var geoJSONLayer = L.geoJSON();

function geoJSONLeafletPromise(url) {
    let geoJSONPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            // you need to return the responseType as json.
            xhr.responseType = 'json';
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });

    geoJSONPromise.then(success => {
        console.log('Worked? ' + success);
        var data = success;
        var arrayOfMetric, scaledMin, scaledMax;
        arrayOfMetric = choroplethMetric(data, /\*\*/);
        scaledMin = Math.min(...arrayOfMetric);
        scaledMax = Math.max(...arrayOfMetric);

        geoJSONLayer = L.geoJSON(data, {
            pointToLayer : function(geoJSONPoint, latlng) {
                return L.polygon(latlng);
            },
            style : function(geoJSONFeature) {
                return featureStyle(geoJSONFeature, scaledMin, scaledMax, -.1);
            },
            onEachFeature : onEachFeature
        }).bindTooltip(function(layer) {
            var text = getAreaCodeAndNameProperties(layer);
            return text;
        }).addTo(map);
    }).catch(
        (rejection) => {
            var geoJSONText = document.getElementById('geojson-text');
            geoJSONText.innerHTML = '<h2>Indicator not available</h2> \
                                        <p>\
                                            If you think it should be available contact us at <a href="mailto:insight@warwickshire.gov.uk?subject=JSNA Mapping - Indicator not available">insight@warwickshire.gov.uk</a>\
                                        </p> \
                                        <p>If you could provide details of the theme, area, and indicator. And what the below error code says:</p> \
                                        ' + '<code>' + rejection + '</code>';
            console.log(rejection);

        }
    );
}

//For now pass in the scaleMin, and scaledMax as Math.min(...a) Math.max(...a)
function featureScaleBetween(number, scaledMin, scaledMax) {
    // This will create the opacity
    return (number - scaledMin) / (scaledMax - scaledMin);
}

function choroplethMetric(data, searchTerm) {
    var dataLength = data.features.length;
    var arrayOfMetric = [];
    for (var i = 0; i < dataLength; i++) {
        // this checks if the number is actually a number you don't want it in the scale otherwise
        if (!isNaN(data.features[i].properties[searchForPropertyContaining(data, searchTerm)])) {
            arrayOfMetric.push(data.features[i].properties[searchForPropertyContaining(data, searchTerm)]);            
        }
        // Probably no need for this else clause once there's no odd issues this can be removed
        else {
            console.log("filtered out of the choropleth scale: " + data.features[i].properties[searchForPropertyContaining(data, searchTerm)]);
        }
    }
    return arrayOfMetric;
}

//develop a function so that you can search on a specific term so we 
//can select a certain key based off a searchTerm found in the properties
// so if the property has ** in it, that will be the choropleth identifier
function searchForPropertyContaining(data, searchTerm) {
    for (var i = 0; i < Object.keys(data.features[0].properties).length; i++) {
        if (Object.keys(data.features[0].properties)[i].search(searchTerm) != -1) {
            return (Object.keys(data.features[0].properties)[i]);
        }
    }
}

function searchForPropertyToColor(feature, searchTerm) {
    for (var i = 0; i < Object.keys(feature.properties).length; i++) {
        if (Object.keys(feature.properties)[i].search(searchTerm) != -1) {
            return (Object.keys(feature.properties)[i]);
        }
    }
}



function featureColor(feature, scaledMin, scaledMax, offsetFillOpacityForZero) {
    if (feature.properties[searchForPropertyToColor(feature, /\*\*/)]) {
        var number = feature.properties[searchForPropertyToColor(feature, /\*\*/)];
        //now deals with supressed figures i.e if the number returned is either "*", or "supressed"
        if (Number(number) === 0 || isNaN(number)) {
            // example geoJSON promise style
            // fillOpacity : 0.2 + featureColor(feature, scaledMin, scaledMax, -.2)
            // return -.2;
            return offsetFillOpacityForZero;
        }
        else {
            return featureScaleBetween(number, scaledMin, scaledMax);            
        }
    }
    else {
        return 0.05;
    }
}


//featureStyle is now dealing with the style in it's entirety, you could do this simpler if the datasets
//were simpler
function featureStyle(geoJSONFeature, scaledMin, scaledMax, offsetFillOpacityForZero) {
    // default color
    var color = 'var(--blue)';
    var weight = 1;
    var fillOpacity = 0.1;
    var fill = true;
    if (geoJSONFeature.properties[searchForPropertyToColor(geoJSONFeature, /\*\*/)]) {
        var number = geoJSONFeature.properties[searchForPropertyToColor(geoJSONFeature, /\*\*/)];
        if (Number(number) === 0) {
            fillOpacity = 0;
        }
        else if (isNaN(number)) {
            // you might want to make this shorter instead of suppressed, just sup?
            if (number.search('suppressed') != -1 || number.search(/\*/) != -1 || number.search('Suppressed') != -1) {
                color = 'var(--green-lightest)';
                fillOpacity = 1;
            }
            if (number.search('No') != -1 || number.search('N/A') != -1) {
                color = '#C11111';
                fillOpacity = 1;
            }
        }
        else {
            fillOpacity = 0.1 + featureScaleBetween(number, scaledMin, scaledMax);
        }
    }
    return {
        color : color,
        weight : weight,
        fillOpacity : fillOpacity,
        fill : fill
    }
}

// Create a scale function - this is actually really useful
// but I've wrote a separate one since leaflet works on each individual feature
// and this works on an array level.
Array.prototype.scaleBetween = function(scaledMin, scaledMax) {
    var max = Math.max.apply(Math, this);
    var min = Math.min.apply(Math, this);
    return this.map(num => (scaledMax - scaledMin)*(num-min)/(max-min)+scaledMin);
}

var properties;
function getAllProperties(layer) {
    var text = '';
    propertiesLength = Object.keys(layer.feature.properties).length;
    for (var i = 0; i < propertiesLength; i++) {
        var objectKey = Object.keys(layer.feature.properties)[i];
        var objectValue = layer.feature.properties[objectKey];
        var textString = '<br/><strong>' + objectKey + '</strong>: ' + objectValue;
        text += textString;
    }
    return '<br/><span style="background-color: black; color: white;"><strong>TEST</strong>: TESTING<br/></span>' + text;
}

function getAreaCodeAndNameProperties(layer) {
    var text = '';
    var textString = '';
    propertiesLength = Object.keys(layer.feature.properties).length;
    for (var i = 0; i < propertiesLength; i++) {
        var objectKey = Object.keys(layer.feature.properties)[i];
        var objectValue = layer.feature.properties[objectKey];
        if (objectKey == 'Area Code') {
            if (objectValue != 'N/A') {
                textString = '<strong>' + objectKey + '</strong>: ' + objectValue + '<br/>';
                text += textString;
            }            
        }
        if (objectKey == 'Area Names') {
            textString = '<strong>' + objectKey + '</strong>: ' + objectValue + '<br/>';
            text += textString;
        }
        if (objectKey == 'JSNA') {
            textString = '<strong>' + objectKey + '</strong>: ' + objectValue;
            text += textString;
        }
    }
    return text;
}

// this is for paragraph so this will look different
function getAllPropertiesSidebar(layer) {
    // the div at the beginning is just an animation
    // it arguably should not be added here.
    // var text = '<div id="ping"></div>';
    var text = '';
    propertiesLength = Object.keys(layer.feature.properties).length;
    // This is for loop should replace the one below it so that it creates
    // an arrray
    var propertyArray = [];
    for (var i = 0; i < propertiesLength; i++) {
        var objectKey = Object.keys(layer.feature.properties)[i];
        var objectValue = layer.feature.properties[objectKey];
        if (objectKey == 'Area Names') {
            propertyArray.unshift([objectKey, objectValue]);
        }
        else if (objectKey == 'JSNA') {
            propertyArray.unshift([objectKey, objectValue]);
        }
        else {
            propertyArray.push([objectKey, objectValue]);        
        }
    }
    //now deal with the arrays so the text can be displayed in a more appropriate way
    for (var i = 0; i < propertyArray.length; i++) {
        if ((propertyArray[i][0] == 'Area Names') || (propertyArray[i][0] == 'JSNA')) {
            if (propertyArray[i][1] == 'N/A') {
                continue;
            }
            else if (propertyArray[i][0] == 'Area Names') {
                text += '<h2>' + propertyArray[i][1] + '</h2><div id="text-heading-container"></div>';
            }
            else if (propertyArray[i][0] == 'JSNA') {
                text += '<h2>' + propertyArray[i][1] + '</h2><div id="text-heading-container"></div>';        
            }
        }
        else if ((propertyArray[i][0] == 'Area Code') && propertyArray[i][1] == 'N/A') {
            continue;
        }
        else if (propertyArray[i][0] == 'Area Type') {
            continue;
        }
        else if ((propertyArray[i][0] == 'District') && (propertyArray[i][1] == 'N/A')) {
            continue;
        }

        else {
            text += '<br/><strong>' + propertyArray[i][0] + '</strong>:<br/>' + propertyArray[i][1];
        }
    }

    text += '<p><small>The map is based on a continous scale, using the information marked with a double star (**)</small></p>';

    return text;
}

// onEachFeature is the reference to leafletjs geojson option
// that's why the function is called onEachFeature (although probably not all that explicit)
var geoJSONParagraph = document.getElementById('geojson-text');
function onEachFeature(feature, layer) {
    var text = getAllPropertiesSidebar(layer);
    layer.on('click', function(e) {
        geoJSONParagraph.innerHTML = text;
    });
}


//grab the select boxes
// declare global fileName with defaults
var fileName;
// var themeName = 'JSNA';
// var areaName = 'LSOA';
// var indicatorName = 'Accidental Dwelling Fire.geojson';
var areaName = '';
var ageGroupName = '';
var academicYearName = '';
var questionName = '';
var areaNames = ['JSNA', 'District'];
//Let's try and rework this into a higher level function
var allSelectBoxes = document.getElementsByTagName('select');

//new 18/04/18
// first selectBox triggers the events now.

var firstSelectBox = allSelectBoxes[0];
firstSelectBox.addEventListener('change', function(e) {
    // this.value should be returned, basically the option value.
    var firstSelectBoxOption = this.value;
    if (firstSelectBox.classList.value == 'start-here') {
        firstSelectBox.classList.remove('start-here');
        firstSelectBox.options[0].remove();
    }
    console.log(this.value);
    // when the area-select is selected change the area name selectbox to the correct dataset.
    for (var i = 1; i < allSelectBoxes.length; i++) {
        if (allSelectBoxes[i].hasAttribute('disabled')) {
            allSelectBoxes[i].removeAttribute('disabled');
        }
    }
    //This needs a new function I think.

}, false);



// This is the area that needs work now.
var themeSelectbox = document.querySelector('select[name="theme-select"]');
themeSelectbox.addEventListener('change', function(e) {
    themeName = this.value;
    //when the theme is selected change the indicator selectbox to the correct
    //datasets.
    var indicatorSelectbox = document.querySelector('select[name="indicator-select"]');
    var areaSelectbox = document.querySelector('select[name="area-select"]');
    areaSelectbox.removeAttribute('disabled');
    indicatorSelectbox.removeAttribute('disabled');
    //we then want to change the available indicator's to the selected theme.
    indicatorSelectbox.options.length = 0;
    //This deals with the data if in themes the data isn't in an array but an object
    if (Object.prototype.toString.call(themes[themeName]) === "[object Object]") {
        for (var i = 0; i < Object.keys(themes[themeName]).length; i++){
            var option = document.createElement('option');
            option.text = Object.keys(themes[themeName])[i];
            option.value = themes[themeName][Object.keys(themes[themeName])[i]];
            indicatorSelectbox.appendChild(option);
        }
    }
    //This deals with the data if in themes the data is in an array
    if (Array.isArray(themes[themeName])) {
        var areaInSelect = areas.indexOf(areaSelectbox.value);
        for (var i = 0; i < Object.keys(themes[themeName][areaInSelect]).length; i++) {
            var option = document.createElement('option');
            option.text = Object.keys(themes[themeName][areaInSelect])[i];
            option.value = themes[themeName][areaInSelect][Object.keys(themes[themeName][areaInSelect])[i]];
            indicatorSelectbox.appendChild(option);
        }
    }
}, false);



var areaSelectbox = document.querySelector('select[name="area-select"]');
areaSelectbox.addEventListener('change', function(e) {
    areaName = this.value;
    var indicatorSelectbox = document.querySelector('select[name="indicator-select"]');
    // indicatorSelectbox.removeAttribute('disabled');
    indicatorSelectbox.options.length = 0;
    //This deals with the data if in themes the data isn't in an array
    if (Object.prototype.toString.call(themes[themeName]) === "[object Object]") {
        for (var i = 0; i < Object.keys(themes[themeName]).length; i++){
            var option = document.createElement('option');
            option.text = Object.keys(themes[themeName])[i];
            option.value = themes[themeName][Object.keys(themes[themeName])[i]];
            indicatorSelectbox.appendChild(option);
        }
    }
    //This deals with the data if in themes the data is in an array
    if (Array.isArray(themes[themeName])) {
        var areaInSelect = areas.indexOf(areaSelectbox.value);
        for (var i = 0; i < Object.keys(themes[themeName][areaInSelect]).length; i++) {
            var option = document.createElement('option');
            option.text = Object.keys(themes[themeName][areaInSelect])[i];
            option.value = themes[themeName][areaInSelect][Object.keys(themes[themeName][areaInSelect])[i]];
            indicatorSelectbox.appendChild(option);
        }
    }
}, false);

var indicatorSelectbox = document.querySelector('select[name="indicator-select"]');
indicatorSelectbox.addEventListener('change', function(e) {
    indicatorName = this.value;
}, false);

// create objects of the values?

// communitySafety has 18 of each indicator - no need to produce two objects
var communitySafety = {
    "Accidental dwelling fires" : 'INTOOL_Accidental Dwelling Fire.geojson',
    "All arson" : "INTOOL_All Arson.geojson",
    "Fire related deaths" : "INTOOL_Fire related death.geojson",
    "Fire related injuries" : "INTOOL_Fire related injuries.geojson",
    "Road traffic accidents" : "INTOOL_RTA.geojson",
    "Deliberate small fires" : "INTOOL_Small Fire.geojson",
    "All sexual offences" : "INTOOL_Template - All Sexual Offences.geojson",
    "Anti-social behaviour" : "INTOOL_Template - Anti Social Behaviour data.geojson",
    //child at risk has been removed due to stakeholder concerns
    "Cyber crime offences" : "INTOOL_Template - Cyber Offences.geojson",
    "Domestic abuse offences and crimed incidents" : "INTOOL_Template - Domestic abuse flag offences.geojson",
    "Domestic burglary offences" : "INTOOL_Template - Domestic Burglary.geojson",
    "Hate offences" : "INTOOL_Template - Hate Offences.geojson",
    "Total recorded crime" : "INTOOL_Template - Total Crime data.geojson",
    "Vehicle crime" : "INTOOL_Template - Vehicle Crime.geojson",
    "Violent crimes with and without injury - drugs and alcohol flag" : "INTOOL_Template - Violence with and without injury drugs and alcohol flag.geojson",
    "Violent crimes with and without injury" : "INTOOL_Template - Violence With and Without Injury.geojson",
    "Crimes committed by offenders aged up to 18" : "INTOOL_Template - Young offenders.geojson",
};

var demographyHousingLSOA =  {
    "IMD housing affordability indicator" : "INTOOL_Housing - Affordability.geojson",
    "Rented (All)" : "INTOOL_Housing - ALL RENTED.geojson",
    "Owned" : "INTOOL_Housing - OWNED.geojson",
    "Total households" : "INTOOL_Housing - Person.geojson",
    "Person - Aged 65 and Over only" : "INTOOL_Housing - Person aged 65 and over.geojson",
    "Person - All households with dependent children only" : "INTOOL_Housing - Person all households with dependent children.geojson",
    "Private rented" : "INTOOL_Housing - PRIVATE RENTED.geojson",
    "Social rented" : "INTOOL_Housing - SOCIAL RENTED.geojson",
    "Mosaic groups - All groups" : "INTOOL_Imported_Mosaic - All Geographies.geojson",
    "Mosaic groups - A only" : "INTOOL_Imported_Mosaic - All Geographies - A only.geojson",
    "Mosaic groups - B only" : "INTOOL_Imported_Mosaic - All Geographies - B only.geojson",
    "Mosaic groups - C only" : "INTOOL_Imported_Mosaic - All Geographies - C only.geojson",
    "Mosaic groups - D only" : "INTOOL_Imported_Mosaic - All Geographies - D only.geojson",
    "Mosaic groups - E only" : "INTOOL_Imported_Mosaic - All Geographies - E only.geojson",
    "Mosaic groups - F only" : "INTOOL_Imported_Mosaic - All Geographies - F only.geojson",
    "Mosaic groups - G only" : "INTOOL_Imported_Mosaic - All Geographies - G only.geojson",
    "Mosaic groups - H only" : "INTOOL_Imported_Mosaic - All Geographies - H only.geojson",
    "Mosaic groups - I only" : "INTOOL_Imported_Mosaic - All Geographies - I only.geojson",
    "Mosaic groups - J only" : "INTOOL_Imported_Mosaic - All Geographies - J only.geojson",
    "Mosaic groups - K only" : "INTOOL_Imported_Mosaic - All Geographies - K only.geojson",
    "Mosaic groups - L only" : "INTOOL_Imported_Mosaic - All Geographies - L only.geojson",
    "Mosaic groups - M only" : "INTOOL_Imported_Mosaic - All Geographies - M only.geojson",
    "Mosaic groups - N only" : "INTOOL_Imported_Mosaic - All Geographies - N only.geojson",
    "Mosaic groups - O only" : "INTOOL_Imported_Mosaic - All Geographies - O only.geojson",
    "Total population" : "INTOOL_Population - Total.geojson",
    "Population trend data" : "INTOOL_Population - Trend Data.geojson",
    "Population - White British" : "INTOOL_Population - White British all geographies.geojson",
    "Population - Black and Minority Ethnic Groups" : "INTOOL_Population - BME all geographies.geojson",
};
var demographyHousingDistrict = {
    "Rented (All)" : "INTOOL_Housing - ALL RENTED.geojson",
    "Median house prices" : "INTOOL_Housing - Median House Prices.geojson",
    "Owned" : "INTOOL_Housing - OWNED.geojson",
    "Total households" : "INTOOL_Housing - Person.geojson",
    "Total households - Single occupancy aged 65 and over" : "INTOOL_Housing - Person aged 65 and over.geojson",
    "Total households - With dependent children" : "INTOOL_Housing - Person all households with dependent children.geojson",
    //changed this
    "Private Registered Provider rents" : "INTOOL_Housing - PRP rents.geojson",
    "Private rented" : "INTOOL_Housing - PRIVATE RENTED.geojson",
    "Social rented" : "INTOOL_Housing - SOCIAL RENTED.geojson",
    "Mosaic groups - All groups" : "INTOOL_Imported_Mosaic - All Geographies.geojson",
    "Mosaic groups - A only" : "INTOOL_Imported_Mosaic - All Geographies - A only.geojson",
    "Mosaic groups - B only" : "INTOOL_Imported_Mosaic - All Geographies - B only.geojson",
    "Mosaic groups - C only" : "INTOOL_Imported_Mosaic - All Geographies - C only.geojson",
    "Mosaic groups - D only" : "INTOOL_Imported_Mosaic - All Geographies - D only.geojson",
    "Mosaic groups - E only" : "INTOOL_Imported_Mosaic - All Geographies - E only.geojson",
    "Mosaic groups - F only" : "INTOOL_Imported_Mosaic - All Geographies - F only.geojson",
    "Mosaic groups - G only" : "INTOOL_Imported_Mosaic - All Geographies - G only.geojson",
    "Mosaic groups - H only" : "INTOOL_Imported_Mosaic - All Geographies - H only.geojson",
    "Mosaic groups - I only" : "INTOOL_Imported_Mosaic - All Geographies - I only.geojson",
    "Mosaic groups - J only" : "INTOOL_Imported_Mosaic - All Geographies - J only.geojson",
    "Mosaic groups - K only" : "INTOOL_Imported_Mosaic - All Geographies - K only.geojson",
    "Mosaic groups - L only" : "INTOOL_Imported_Mosaic - All Geographies - L only.geojson",
    "Mosaic groups - M only" : "INTOOL_Imported_Mosaic - All Geographies - M only.geojson",
    "Mosaic groups - N only" : "INTOOL_Imported_Mosaic - All Geographies - N only.geojson",
    "Mosaic groups - O only" : "INTOOL_Imported_Mosaic - All Geographies - O only.geojson",
    "Population Projections" : "INTOOL_Population - Projections.geojson",
    "Total population" : "INTOOL_Population - Total.geojson",
    "Population trend data" : "INTOOL_Population - Trend Data.geojson",
    "Population - White British" : "INTOOL_Population - White British all geographies.geojson",
    "Population - Black and Minority Ethnic Groups" : "INTOOL_Population - BME all geographies.geojson",
};

var demographyHousingCCG = {
    "Rented (All)" : "INTOOL_Housing - ALL RENTED.geojson",
    "Median house prices" : "INTOOL_Housing - Median House Prices.geojson",
    "Owned" : "INTOOL_Housing - OWNED.geojson",
    "Total households - Single occupancy aged 65 and over" : "INTOOL_Housing - Person aged 65 and over.geojson",
    "Total households - With dependent children" : "INTOOL_Housing - Person all households with dependent children.geojson",
    "Private Registered Provider rents" : "INTOOL_Housing - PRP rents.geojson",
    "Private rented" : "INTOOL_Housing - PRIVATE RENTED.geojson",
    "Social rented" : "INTOOL_Housing - SOCIAL RENTED.geojson",
    "Mosaic groups - All groups" : "INTOOL_Imported_Mosaic - All Geographies.geojson",
    "Mosaic groups - A only" : "INTOOL_Imported_Mosaic - All Geographies - A only.geojson",
    "Mosaic groups - B only" : "INTOOL_Imported_Mosaic - All Geographies - B only.geojson",
    "Mosaic groups - C only" : "INTOOL_Imported_Mosaic - All Geographies - C only.geojson",
    "Mosaic groups - D only" : "INTOOL_Imported_Mosaic - All Geographies - D only.geojson",
    "Mosaic groups - E only" : "INTOOL_Imported_Mosaic - All Geographies - E only.geojson",
    "Mosaic groups - F only" : "INTOOL_Imported_Mosaic - All Geographies - F only.geojson",
    "Mosaic groups - G only" : "INTOOL_Imported_Mosaic - All Geographies - G only.geojson",
    "Mosaic groups - H only" : "INTOOL_Imported_Mosaic - All Geographies - H only.geojson",
    "Mosaic groups - I only" : "INTOOL_Imported_Mosaic - All Geographies - I only.geojson",
    "Mosaic groups - J only" : "INTOOL_Imported_Mosaic - All Geographies - J only.geojson",
    "Mosaic groups - K only" : "INTOOL_Imported_Mosaic - All Geographies - K only.geojson",
    "Mosaic groups - L only" : "INTOOL_Imported_Mosaic - All Geographies - L only.geojson",
    "Mosaic groups - M only" : "INTOOL_Imported_Mosaic - All Geographies - M only.geojson",
    "Mosaic groups - N only" : "INTOOL_Imported_Mosaic - All Geographies - N only.geojson",
    "Mosaic groups - O only" : "INTOOL_Imported_Mosaic - All Geographies - O only.geojson",
    "Total population" : "INTOOL_Population - Total.geojson",
    "Population - White British" : "INTOOL_Population - White British all geographies.geojson",
    "Population - Black and Minority Ethnic Groups" : "INTOOL_Population - BME all geographies.geojson",
};

var demographyHousingJSNA = {
    "Rented (All)" : "INTOOL_Housing - ALL RENTED.geojson",
    "Owned" : "INTOOL_Housing - OWNED.geojson",
    "Total households - Single occupancy aged 65 and over" : "INTOOL_Housing - Person aged 65 and over.geojson",
    "Total households - With dependent children" : "INTOOL_Housing - Person all households with dependent children.geojson",
    "Private rented" : "INTOOL_Housing - PRIVATE RENTED.geojson",
    "Social rented" : "INTOOL_Housing - SOCIAL RENTED.geojson",
    "Mosaic groups - All groups" : "INTOOL_Imported_Mosaic - All Geographies.geojson",
    "Mosaic groups - A only" : "INTOOL_Imported_Mosaic - All Geographies - A only.geojson",
    "Mosaic groups - B only" : "INTOOL_Imported_Mosaic - All Geographies - B only.geojson",
    "Mosaic groups - C only" : "INTOOL_Imported_Mosaic - All Geographies - C only.geojson",
    "Mosaic groups - D only" : "INTOOL_Imported_Mosaic - All Geographies - D only.geojson",
    "Mosaic groups - E only" : "INTOOL_Imported_Mosaic - All Geographies - E only.geojson",
    "Mosaic groups - F only" : "INTOOL_Imported_Mosaic - All Geographies - F only.geojson",
    "Mosaic groups - G only" : "INTOOL_Imported_Mosaic - All Geographies - G only.geojson",
    "Mosaic groups - H only" : "INTOOL_Imported_Mosaic - All Geographies - H only.geojson",
    "Mosaic groups - I only" : "INTOOL_Imported_Mosaic - All Geographies - I only.geojson",
    "Mosaic groups - J only" : "INTOOL_Imported_Mosaic - All Geographies - J only.geojson",
    "Mosaic groups - K only" : "INTOOL_Imported_Mosaic - All Geographies - K only.geojson",
    "Mosaic groups - L only" : "INTOOL_Imported_Mosaic - All Geographies - L only.geojson",
    "Mosaic groups - M only" : "INTOOL_Imported_Mosaic - All Geographies - M only.geojson",
    "Mosaic groups - N only" : "INTOOL_Imported_Mosaic - All Geographies - N only.geojson",
    "Mosaic groups - O only" : "INTOOL_Imported_Mosaic - All Geographies - O only.geojson",
    "Total population" : "INTOOL_Population - Total.geojson",
    "Population - White British" : "INTOOL_Population - White British all geographies.geojson",
    "Population - Black and Minority Ethnic Groups" : "INTOOL_Population - BME all geographies.geojson",
};





var educationEconomyEmploymentLSOA = {
    "Child benefit data" : "INTOOL_Final Child Benefit Data.geojson",
    "Households in fuel poverty" : "INTOOL_FuelPovertyUPDATED.geojson",
    "Job Seekers Allowance (JSA) claimants" : "INTOOL_Job Seekers Allowance Claimants.geojson",
    "Long term unemployed (JSA for over 12 months)" : "INTOOL_Long term unemployed (JSA for over 12 months) March 2017.geojson",
    "Universal Credit claimants" : "INTOOL_Universal Credit Claimants.geojson",
    "Education - Early Years - children achieving a Good Level of Developement - eligible for Free School Meals" : "TOMF ALL Education Data FOR MAPPING Early Years - eligible for free school meals.geojson",
    "Education - Early Years - children achieving a Good Level of Developement - not eligible for Free School Meals" : "TOMF ALL Education Data FOR MAPPING Early Years - not eligible for free school meals.geojson",    
    "Education - Key Stage 2 - all children" : "TOMF ALL Education Data FOR MAPPING Key Stage 2 - all children.geojson",
    "Education - Key Stage 2 - disadvantaged" : "TOMF ALL Education Data FOR MAPPING Key Stage 2 - disadvantaged.geojson",
    "Education - Key Stage 4 Attainment 8" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Att 8.geojson",
    "Education - Key Stage 4 Progress 8 - all children" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Pro 8 - all children.geojson",
    "Education - Key Stage 4 Progress 8 - disadvantaged" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Pro 8 - disadvantaged.geojson",
    "Education - Special Educational Needs - children with EHC plans" : "TOMF ALL Education Data FOR MAPPING Other - children with EHC plans.geojson",
    "Education - Children eligible and claiming a Free School Meal" : "TOMF ALL Education Data FOR MAPPING Other - eligible and claiming a free school meal.geojson",
    "Education - Children attending a good or outstanding school" : "TOMF ALL Education Data FOR MAPPING Other - pupils attending a good or outstanding school.geojson",
};

var educationEconomyEmploymentDistrict = {
    "Child benefit data" : "INTOOL_Final Child Benefit Data.geojson",
    "Households in fuel poverty" : "INTOOL_FuelPovertyUPDATED.geojson",
    "Gross annual earnings" : "INTOOL_GrossAnnualEarnings.geojson",
    "Job Seekers Allowance (JSA) claimants" : "INTOOL_Job Seekers Allowance Claimants.geojson",
    "Long term unemployed (JSA for over 12 months)" : "INTOOL_Long term unemployed (JSA for over 12 months) March 2017.geojson",
    "Universal Credit claimants" : "INTOOL_Universal Credit Claimants.geojson",
    "Education - Early Years - children achieving a Good Level of Developement - eligible for Free School Meals" : "TOMF ALL Education Data FOR MAPPING Early Years - eligible for free school meals.geojson",
    "Education - Early Years - children achieving a Good Level of Developement - not eligible for Free School Meals" : "TOMF ALL Education Data FOR MAPPING Early Years - not eligible for free school meals.geojson",    
    "Education - Key Stage 2 - all children" : "TOMF ALL Education Data FOR MAPPING Key Stage 2 - all children.geojson",
    "Education - Key Stage 2 - disadvantaged" : "TOMF ALL Education Data FOR MAPPING Key Stage 2 - disadvantaged.geojson",
    "Education - Key Stage 4 Attainment 8" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Att 8.geojson",
    "Education - Key Stage 4 Progress 8 - all children" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Pro 8 - all children.geojson",
    "Education - Key Stage 4 Progress 8 - disadvantaged" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Pro 8 - disadvantaged.geojson",
    "Education - Special Educational Needs - children with EHC plans" : "TOMF ALL Education Data FOR MAPPING Other - children with EHC plans.geojson",
    "Education - Children eligible and claiming a Free School Meal" : "TOMF ALL Education Data FOR MAPPING Other - eligible and claiming a free school meal.geojson",
    "Education - Children attending a good or outstanding school" : "TOMF ALL Education Data FOR MAPPING Other - pupils attending a good or outstanding school.geojson",
};

var educationEconomyEmploymentCCG = {
    "Child benefit data" : "INTOOL_Final Child Benefit Data.geojson",
    "Households in fuel poverty" : "INTOOL_FuelPovertyUPDATED.geojson",
    "Gross annual earnings" : "INTOOL_GrossAnnualEarnings.geojson",
    "Job Seekers Allowance (JSA) claimants" : "INTOOL_Job Seekers Allowance Claimants.geojson",
    "Long term unemployed (JSA for over 12 months)" : "INTOOL_Long term unemployed (JSA for over 12 months) March 2017.geojson",
    "Universal Credit claimants" : "INTOOL_Universal Credit Claimants.geojson",
    "Education - Early Years development" : "ALL Education Data FOR MAPPING Early Years - development.geojson",
    // "Education - Early Years eligible for Free School Meals" : "TOMF ALL Education Data FOR MAPPING Early Years - eligible for free school meals.geojson",
    // "Education - Early Years not eligible for Free School Meals" : "TOMF ALL Education Data FOR MAPPING Early Years - not eligible for free school meals.geojson",    
    // "Education - Key Stage 2 - all children" : "TOMF ALL Education Data FOR MAPPING Key Stage 2 - all children.geojson",
    // "Education - Key Stage 2 - disadvantaged" : "TOMF ALL Education Data FOR MAPPING Key Stage 2 - disadvantaged.geojson",
    "Education - Key Stage 2 - achievement": "ALL Education Data FOR MAPPING KS2 - achievement.geojson",
    "Education - Key Stage 4 Attainment 8" : "ALL Education Data FOR MAPPING Key Stage 4 Att 8.geojson",
    // "Education - Key Stage 4 Progress 8 - all children" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Pro 8 - all children.geojson",
    // "Education - Key Stage 4 Progress 8 - disadvantaged" : "TOMF ALL Education Data FOR MAPPING Key Stage 4 Pro 8 - disadvantaged.geojson",
    "Education - Special Educational Needs - primary children with EHC plans" : "Education Data FOR MAPPING Other - primary children with EHC plans.geojson",
    "Education - Special Educational Needs - secondary children with EHC plans" : "Education Data FOR MAPPING Other - secondary children with EHC plans.geojson",
    "Education - Children eligible and claiming a Free School Meal" : "TOMF ALL Education Data FOR MAPPING Other - eligible and claiming a free school meal.geojson",
    "Education - Children attending a good or outstanding school" : "TOMF ALL Education Data FOR MAPPING Other - pupils attending a good or outstanding school.geojson",
};

var educationEconomyEmploymentJSNA = {
    "Child benefit data" : "INTOOL_Final Child Benefit Data.geojson",
    "Households in fuel poverty" : "INTOOL_FuelPovertyUPDATED.geojson",
    "Job Seekers Allowance (JSA) claimants" : "INTOOL_Job Seekers Allowance Claimants.geojson",
    "Long term unemployed (JSA for over 12 months)" : "INTOOL_Long term unemployed (JSA for over 12 months) March 2017.geojson",
    "Universal Credit claimants" : "INTOOL_Universal Credit Claimants.geojson",
    "Education - Early Years development" : "ALL Education Data FOR MAPPING Early Years - development.geojson",
    "Education - Key Stage 2 - achievement": "ALL Education Data FOR MAPPING KS2 - achievement.geojson",
    "Education - Key Stage 4 Attainment 8" : "ALL Education Data FOR MAPPING Key Stage 4 Att 8.geojson",
    "Education - Special Educational Needs - primary children with EHC plans" : "Education Data FOR MAPPING Other - primary children with EHC plans.geojson",
    "Education - Special Educational Needs - secondary children with EHC plans" : "Education Data FOR MAPPING Other - secondary children with EHC plans.geojson",
    "Education - Children eligible and claiming a Free School Meal" : "TOMF ALL Education Data FOR MAPPING Other - eligible and claiming a free school meal.geojson",
    "Education - Children attending a good or outstanding school" : "TOMF ALL Education Data FOR MAPPING Other - pupils attending a good or outstanding school.geojson",
};

var healthAndWellbeingLSOA = {
    "Deaths" : "Hopefully Corrected Deaths.geojson",
    "Secondary care referrals" : "INTOOL_COMPLETED DATA - CCG June 2017 - secondary care referrals.geojson",
    "Unplanned or A&E admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned a&e admissions.geojson",
    "Emergency admissions for acute conditions that should not require hospital admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - emergency admissions for acute conditions that should not require hospital admission.geojson",
    "Unplanned hospitalisation for long term conditions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned hospitalisation for long term conditions.geojson",
    "Top 5 reasons for hospital admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - top 5 reasons for hospital admissions.geojson",
    "General Health - Very Good" : "INTOOL_General Health - Very Good.geojson",
    "General Health - Good" : "INTOOL_General Health - Good.geojson",
    "General Health - Fair" : "INTOOL_General Health - Fair.geojson",
    "General Health - Bad" : "INTOOL_General Health - Bad.geojson",
    "General Health - Very Bad" : "INTOOL_General Health - Very Bad.geojson",
    "Long term health problem or disability" : "INTOOL_Long term health problem or disability.geojson",
    "Provision of unpaid care" : "INTOOL_Provision of Unpaid Care.geojson",
    "Provision of unpaid care 50+ hours" : "INTOOL_Provision of Unpaid Care 50 plus hours.geojson",
};

var healthAndWellbeingDistrict = {
    "Deaths" : "Hopefully Corrected Deaths.geojson",
    "Child obesity reception" : "INTOOL_COMPLETED - Public Health data - child obesity reception.geojson",
    "Child obesity year 6" : "INTOOL_COMPLETED - Public Health data - child obesity year 6.geojson",
    "Life expectancy at birth - Male indicator" : "INTOOL_COMPLETED - Public Health data - life expectancy at birth male.geojson",
    "Life expectancy at birth - Female indicator" : "INTOOL_COMPLETED - Public Health data - life expectancy at birth female.geojson",
    "Teenage conceptions - ages 15 to 17" : "INTOOL_COMPLETED - Public Health data - teenage conceptions.geojson",
    "Infant Mortality" : "INTOOL_COMPLETED - Public Health data - infant mortality.geojson",
    "Smoking prevalence in adults" : "INTOOL_COMPLETED - Public Health data - smoking prevalence in adults.geojson",
    "Alcohol related hospital admissions" : "INTOOL_COMPLETED - Public Health data - alcohol related hospital admissions.geojson",
    "Inactive adults" : "INTOOL_COMPLETED - Public Health data - inactive adults.geojson",
    "Suicide" : "INTOOL_COMPLETED - Public Health data - suicide.geojson",
    "Self harm admissions as primary admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - self harm admissions as primary admission.geojson",
    "Secondary care referrals" : "INTOOL_COMPLETED DATA - CCG June 2017 - secondary care referrals.geojson",
    "Unplanned or A&E admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned a&e admissions.geojson",
    "Emergency admissions for acute conditions that should not require hospital admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - emergency admissions for acute conditions that should not require hospital admission.geojson",
    "Unplanned hospitalisation for long term conditions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned hospitalisation for long term conditions.geojson",
    "Top 5 reasons for hospital admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - top 5 reasons for hospital admissions.geojson",
    "General Health - Very Good" : "INTOOL_General Health - Very Good.geojson",
    "General Health - Good" : "INTOOL_General Health - Good.geojson",
    "General Health - Fair" : "INTOOL_General Health - Fair.geojson",
    "General Health - Bad" : "INTOOL_General Health - Bad.geojson",
    "General Health - Very Bad" : "INTOOL_General Health - Very Bad.geojson",
    "Long term health problem or disability" : "INTOOL_Long term health problem or disability.geojson",
    "Provision of unpaid care" : "INTOOL_Provision of Unpaid Care.geojson",
    "Provision of unpaid care 50+ hours" : "INTOOL_Provision of Unpaid Care 50 plus hours.geojson",
    
};

var healthAndWellbeingCCG = {
    "Self harm admissions as primary admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - self harm admissions as primary admission.geojson",
    "Secondary care referrals" : "INTOOL_COMPLETED DATA - CCG June 2017 - secondary care referrals.geojson",
    "Unplanned or A&E admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned a&e admissions.geojson",
    "Emergency admissions for acute conditions that should not require hospital admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - emergency admissions for acute conditions that should not require hospital admission.geojson",
    "Unplanned hospitalisation for long term conditions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned hospitalisation for long term conditions.geojson",
    "Top 5 reasons for hospital admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - top 5 reasons for hospital admissions.geojson",
    "Cancer treatment - 2 week wait" : "INTOOL_COMPLETED DATA - CCG June 2017 - cancer treatment - 2 week wait.geojson",
    "Cancer treatment - 62 day wait" : "INTOOL_COMPLETED DATA - CCG June 2017 - cancer treatment - 62 day wait.geojson",
    "Cancers diagnosed at an early stage" : "INTOOL_COMPLETED DATA - CCG June 2017 - cancers diagnosed at an early stage.geojson",
    "Dementia diagnosis" : "INTOOL_COMPLETED DATA - CCG June 2017 - dementia diagnosis.geojson",
    "Diabetes prevalence" : "INTOOL_COMPLETED DATA - CCG June 2017 - diabetes prevalence.geojson",
    "Diabetes diagnosis rate" : "INTOOL_COMPLETED DATA - CCG June 2017 - diabetes diagnosis rate.geojson",
    "General Health - Very Good" : "INTOOL_General Health - Very Good.geojson",
    "General Health - Good" : "INTOOL_General Health - Good.geojson",
    "General Health - Fair" : "INTOOL_General Health - Fair.geojson",
    "General Health - Bad" : "INTOOL_General Health - Bad.geojson",
    "General Health - Very Bad" : "INTOOL_General Health - Very Bad.geojson",
    "Long term health problem or disability" : "INTOOL_Long term health problem or disability.geojson",
    "Provision of unpaid care" : "INTOOL_Provision of Unpaid Care.geojson",
    "Provision of unpaid care 50+ hours" : "INTOOL_Provision of Unpaid Care 50 plus hours.geojson",
};

var healthAndWellbeingJSNA = {
    // This mortality is different to Deaths file.
    "Mortality" : "INTOOL_COMPLETED - Public Health data - mortality.geojson",
    "Child obesity (Age 4-5)" : "INTOOL_COMPLETED - Public Health data - child obesity years 4-5.geojson",
    "Child obesity year 6" : "INTOOL_COMPLETED - Public Health data - child obesity year 6.geojson",
    "Self harm admissions as primary admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - self harm admissions as primary admission.geojson",
    "Secondary care referrals" : "INTOOL_COMPLETED DATA - CCG June 2017 - secondary care referrals.geojson",
    "Unplanned or A&E admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned a&e admissions.geojson",
    "Emergency admissions for acute conditions that should not require hospital admission" : "INTOOL_COMPLETED DATA - CCG June 2017 - emergency admissions for acute conditions that should not require hospital admission.geojson",
    "Unplanned hospitalisation for long term conditions" : "INTOOL_COMPLETED DATA - CCG June 2017 - unplanned hospitalisation for long term conditions.geojson",
    "Top 5 reasons for hospital admissions" : "INTOOL_COMPLETED DATA - CCG June 2017 - top 5 reasons for hospital admissions.geojson",
    "General Health - Very Good" : "INTOOL_General Health - Very Good.geojson",
    "General Health - Good" : "INTOOL_General Health - Good.geojson",
    "General Health - Fair" : "INTOOL_General Health - Fair.geojson",
    "General Health - Bad" : "INTOOL_General Health - Bad.geojson",
    "General Health - Very Bad" : "INTOOL_General Health - Very Bad.geojson",
    "Long term health problem or disability" : "INTOOL_Long term health problem or disability.geojson",
    "Provision of unpaid care" : "INTOOL_Provision of Unpaid Care.geojson",
    "Provision of unpaid care 50+ hours" : "INTOOL_Provision of Unpaid Care 50 plus hours.geojson",
};

var socialCareAndEarlyHelpLSOA = {
    // yes lsoas is actually in the title 
    "Early Help - Single Assessments (EHSA) initiated" : "EH JSNA Report - LSOAs - number of EHSA initiated.geojson",
    "Early Help - Evaluations with positive outcomes" : "EH JSNA Report - LSOAs - EH evaluations - positive outcomes.geojson",
    "Early Help - Single Assessments (EHSA) that were stepped down from social care" : "EH JSNA Report - LSOAS - EHSA that were stepped down from social care.geojson",
    "Early Help - Family Support Worker (FSW) open cases" : "EH JSNA Report - LSOAs - EH family support worker cases.geojson",
    "Early Help - Priority Families - % of total number of priority families" : "Priority Families - percentage of total number of priority families.geojson",
    "Early Help - Priority Families - rate per 1,000 households" : "Priority Families - rate per 1,000 households.geojson",
    //Children's
    "Children's Social Care - Children Looked After (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social Care data (Modified) - children looked after.geojson",
    "Children's Social Care - subject to a Child Protection Plan (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children subject to a child protection plan.geojson",
    "Children's Social Care - Young People aged 18-21 receiving a service from Leaving Care (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - young people 18-21 receiving a service from leaving care.geojson",
    "Children's Social Care - Looked After as of 31 March 2017 subject to a Placement Order" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children looked after subject to a placement order.geojson",
    //Adult Social Care
    "Adult Social Care - People in receipt of services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - active service users in year.geojson",
    "Adult Social Care - People in receipt of services - Residential (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - residential.geojson",
    "Adult Social Care - People in receipt of services - Community (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - community.geojson",
    "Adult Social Care - People in receipt of services - Low Level Preventative (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - low level services.geojson",
    "Adult Social Care - People starting first service (2016/2017)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - started any service.geojson",
    "Adult Social Care - People ending a service (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - ended any service.geojson",
    "Adult Social Care - New assessments completed (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - new assessments.geojson",
    "Adult Social Care - Active packages - Learning Disability (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - learning disability packages.geojson",
    "Adult Social Care - Active packages - Mental Health (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - mental health packages.geojson",
    "Adult Social Care - Active packages - Occupational Therapy (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - occupational therapy packages.geojson",
    "Adult Social Care - Active packages - Older People (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - older people packages.geojson",
    "Adult Social Care - Active packages - Other (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - other packages.geojson",
    "Adult Social Care - Active packages - Physical Disability Support Services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - physical, disability and sensory services packages.geojson",
    "Adult Social Care - Active packages - Reablement (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - reablement packages.geojson",
};

var socialCareAndEarlyHelpDistrict = {
    // yes LSOAs is actually in the title of some of these - it's the name of the file not an error.
    "Early Help - Single Assessments (EHSA) initiated" : "EH JSNA Report - LSOAs - number of EHSA initiated.geojson",
    "Early Help - Evaluations with positive outcomes" : "EH JSNA Report - LSOAs - EH evaluations - positive outcomes.geojson",
    "Early Help - Single Assessments (EHSA) that were stepped down from social care" : "EH JSNA Report - LSOAS - EHSA that were stepped down from social care.geojson",
    "Early Help - Family Support Worker (FSW) open cases" : "EH JSNA Report - LSOAs - EH family support worker cases.geojson",
    "Early Help - Priority Families - % of total number of priority families" : "Priority Families - percentage of total number of priority families.geojson",
    "Early Help - Priority Families - rate per 1,000 households" : "Priority Families - rate per 1,000 households.geojson",
    //Children's
    "Children's Social Care - Children Looked After (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social Care data (Modified) - children looked after.geojson",
    "Children's Social Care - subject to a Child Protection Plan (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children subject to a child protection plan.geojson",
    "Children's Social Care - Young People aged 18-21 receiving a service from Leaving Care (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - young people 18-21 receiving a service from leaving care.geojson",
    "Children's Social Care - Looked After as of 31 March 2017 subject to a Placement Order" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children looked after subject to a placement order.geojson",
    //Adult Social Care
    "Adult Social Care - People in receipt of services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - active service users in year.geojson",
    "Adult Social Care - People in receipt of services - Residential (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - residential.geojson",
    "Adult Social Care - People in receipt of services - Community (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - community.geojson",
    "Adult Social Care - People in receipt of services - Low Level Preventative (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - low level services.geojson",
    "Adult Social Care - People starting first service (2016/2017)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - started any service.geojson",
    "Adult Social Care - People ending a service (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - ended any service.geojson",
    "Adult Social Care - New assessments completed (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - new assessments.geojson",
    "Adult Social Care - Active packages - Learning Disability (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - learning disability packages.geojson",
    "Adult Social Care - Active packages - Mental Health (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - mental health packages.geojson",
    "Adult Social Care - Active packages - Occupational Therapy (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - occupational therapy packages.geojson",
    "Adult Social Care - Active packages - Older People (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - older people packages.geojson",    
    "Adult Social Care - Active packages - Other (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - other packages.geojson",
    "Adult Social Care - Active packages - Physical Disability Support Services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - physical, disability and sensory services packages.geojson",
    "Adult Social Care - Active packages - Reablement (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - reablement packages.geojson",
};

var socialCareAndEarlyHelpCCG = {
    "Early Help - Single Assessments (EHSA) initiated" : "EH JSNA Report - LSOAs - number of EHSA initiated.geojson",
    "Early Help - Evaluations with positive outcomes" : "EH JSNA Report - LSOAs - EH evaluations - positive outcomes.geojson",
    "Early Help - Single Assessments (EHSA) that were stepped down from social care" : "EH JSNA Report - LSOAS - EHSA that were stepped down from social care.geojson",
    "Early Help - Family Support Worker (FSW) open cases" : "EH JSNA Report - LSOAs - EH family support worker cases.geojson",
    "Early Help - Priority Families" : "Priority Families.geojson",
    //Children's
    "Children's Social Care - Children Looked After (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social Care data (Modified) - children looked after.geojson",
    "Children's Social Care - subject to a Child Protection Plan (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children subject to a child protection plan.geojson",
    // "Young People aged 18-21 receiving a service from Leaving Care (to 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - young people 18-21 receiving a service from leaving care.geojson",
    // "Children Looked After as of 31 March 2017 subject to a Placement Order" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children looked after subject to a placement order.geojson",
    //Adult Social Care
    "Adult Social Care - People in receipt of services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - active service users in year.geojson",
    "Adult Social Care - People in receipt of services - Residential (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - residential.geojson",
    "Adult Social Care - People in receipt of services - Community (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - community.geojson",
    "Adult Social Care - People in receipt of services - Low Level Preventative (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - low level services.geojson",
    "Adult Social Care - People starting first service (2016/2017)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - started any service.geojson",
    "Adult Social Care - People ending a service (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - ended any service.geojson",
    "Adult Social Care - New assessments completed (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - new assessments.geojson",
    "Adult Social Care - Active packages - Learning Disability (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - learning disability packages.geojson",
    "Adult Social Care - Active packages - Mental Health (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - mental health packages.geojson",
    "Adult Social Care - Active packages - Occupational Therapy (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - occupational therapy packages.geojson",
    "Adult Social Care - Active packages - Older People (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - older people packages.geojson",
    "Adult Social Care - Active packages - Other (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - other packages.geojson",
    "Adult Social Care - Active packages - Physical Disability Support Services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - physical, disability and sensory services packages.geojson",
    "Adult Social Care - Active packages - Reablement (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - reablement packages.geojson",
    "Adult Social Care - Active packages - Total (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - total packages.geojson",
    // "Priority Families - % of total number of priority families" : "Priority Families - percentage of total number of priority families.geojson",
};

var socialCareAndEarlyHelpJSNA = {
    "Early Help - Single Assessments (EHSA) initiated" : "EH JSNA Report - LSOAs - number of EHSA initiated.geojson",
    "Early Help - Evaluations with positive outcomes" : "EH JSNA Report - LSOAs - EH evaluations - positive outcomes.geojson",
    "Early Help - Single Assessments (EHSA) that were stepped down from social care" : "EH JSNA Report - LSOAS - EHSA that were stepped down from social care.geojson",
    "Early Help - Family Support Worker (FSW) open cases" : "EH JSNA Report - LSOAs - EH family support worker cases.geojson",
    "Early Help - Priority Families" : "Priority Families.geojson",
    //Children's
    "Children's Social Care - Children Looked After (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social Care data (Modified) - children looked after.geojson",
    "Children's Social Care - subject to a Child Protection Plan (at 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children subject to a child protection plan.geojson",
    // "Young People aged 18-21 receiving a service from Leaving Care (to 31 March 2017)" : "INTOOL_COMPLETED - Children's Social care data (Modified) - young people 18-21 receiving a service from leaving care.geojson",
    // "Children Looked After as of 31 March 2017 subject to a Placement Order" : "INTOOL_COMPLETED - Children's Social care data (Modified) - children looked after subject to a placement order.geojson",
    //Adult Social Care
    "Adult Social Care - People in receipt of services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - active service users in year.geojson",
    "Adult Social Care - People in receipt of services - Residential (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - residential.geojson",
    "Adult Social Care - People in receipt of services - Community (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - community.geojson",
    "Adult Social Care - People in receipt of services - Low Level Preventative (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - low level services.geojson",
    "Adult Social Care - People starting first service (2016/2017)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - started any service.geojson",
    "Adult Social Care - People ending a service (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - ended any service.geojson",
    "Adult Social Care - New assessments completed (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - new assessments.geojson",
    "Adult Social Care - Active packages - Learning Disability (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - learning disability packages.geojson",
    "Adult Social Care - Active packages - Mental Health (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - mental health packages.geojson",
    "Adult Social Care - Active packages - Occupational Therapy (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - occupational therapy packages.geojson",
    "Adult Social Care - Active packages - Older People (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - older people packages.geojson",
    "Adult Social Care - Active packages - Other (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - other packages.geojson",
    "Adult Social Care - Active packages - Physical Disability Support Services (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - physical, disability and sensory services packages.geojson",
    "Adult Social Care - Active packages - Reablement (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - reablement packages.geojson",
    "Adult Social Care - Active packages - Total (2016/17)" : "INTOOL_COMPLETED JSNA Profiles Adult Social Care Data - total packages.geojson",
    // "Priority Families - % of total number of priority families" : "Priority Families - percentage of total number of priority families.geojson",
};

var livingInWarksResultsDistrict= {
    "That feel strongly they belong to their immediate neighbourhood" : "INTOOL_LiW Survey ResultsUPDATED - feel you belong to your neighbourhood.geojson",
    "Residents who have volunteered over the past year" : "INTOOL_LiW Survey ResultsUPDATED - residents who volunteered.geojson",
    // These will need checking from this point
    "Finding it difficult or very difficult on current household income" : "INTOOL_LiW Survey ResultsUPDATED - difficult or very difficult on current household income.geojson",
    "Fairly worried or very worried about long-term financial planning" : "INTOOL_LiW Survey ResultsUPDATED - fairly worried or very worried about long-term financial planning.geojson",
    "Who feel isolated from others most of the time or almost always" : "INTOOL_LiW Survey ResultsUPDATED - who feel isolated from others most of the time or almost always.geojson",
    "Who provide unpaid care (all hours)" : "INTOOL_LiW Survey ResultsUPDATED - who provide unpaid care (all hours).geojson",
    "Who have a long standing illness, disability or infirmity" : "INTOOL_LiW Survey ResultsUPDATED - who have a long standing illness, disability or infirmity.geojson",
    "Who rate their health as bad or very bad" : "INTOOL_LiW Survey ResultsUPDATED - who rate their health as bad or very bad.geojson",
    "Classified as overweight or obese" : "INTOOL_LiW Survey ResultsUPDATED - classified as overweight or obese.geojson",
    "Drinking at increasing or high risk levels" : "INTOOL_LiW Survey ResultsUPDATED - drinking at increasing or high risk levels.geojson",
    "Current smokers and smokers trying to quit combined" : "INTOOL_LiW Survey ResultsUPDATED - current smokers and smokers trying to quit combined.geojson",
    "Who think crime has increased in their neighbourhood" : "INTOOL_LiW Survey ResultsUPDATED - who think crime has increased in their neighbourhood.geojson",
    "Not very or not at all safe working alone after dark" : "INTOOL_LiW Survey ResultsUPDATED - not very or not at all safe working alone after dark.geojson",
    "Fairly or very worried about having their homes broken into and having something stolen" : "INTOOL_LiW Survey ResultsUPDATED - fairly or very worried about having their homes broken into and having something stolen.geojson",
    "Fairly or very worried about having their car stolen" : "INTOOL_LiW Survey ResultsUPDATED - fairly or very worried about having their car stolen.geojson",
    "Fairly or very worried about being physically attacked by stangers" : "INTOOL_LiW Survey ResultsUPDATED - fairly or very worried about being physically attacked by stangers.geojson",
    "Fairly or very worried about being victims of cybercrime" : "INTOOL_LiW Survey ResultsUPDATED - fairly or very worried about being victims of cybercrime.geojson",
    "Believe anti-social behaviour has increased in their neighbourhood" : "INTOOL_LiW Survey ResultsUPDATED - believe anti-social behaviour has increased in their neighbourhood.geojson",
}

//this might need to be dealt with better
//might need to deal with this better in the promise.
var noData = {
    "No indicators available at this level" : null
};

var noTheme = {
    "You need to select a theme" : null
};


// put all the themes in one box and make them callable?
var themes = {
    "no-theme" : noTheme,
    "community-safety" : communitySafety,
    "demography-and-housing" : [demographyHousingLSOA, demographyHousingDistrict, demographyHousingCCG, demographyHousingJSNA],
    "education-economy-employment-income-and-poverty" : [educationEconomyEmploymentLSOA, educationEconomyEmploymentDistrict, educationEconomyEmploymentCCG, educationEconomyEmploymentJSNA],
    "health-and-wellbeing" : [healthAndWellbeingLSOA, healthAndWellbeingDistrict, healthAndWellbeingCCG, healthAndWellbeingJSNA],
    "social-care-and-early-help" : [socialCareAndEarlyHelpLSOA, socialCareAndEarlyHelpDistrict, socialCareAndEarlyHelpCCG, socialCareAndEarlyHelpJSNA],
    // note the use of the noData object
    "living-in-warks-results" : [noData, livingInWarksResultsDistrict, noData, noData],
}

var areas = [
    "LSOA",
    "District",
    "CCG",
    "JSNA",
]

//Move everything into one big event listener on the select box,
//to remove all the current issues.
//the intention being that it will constantly check the selectbox
// values
var selectDiv = document.getElementById('selection-div');
selectDiv.addEventListener('change', function(e) {
    var themeSelectbox = selectDiv.querySelector('select[name="theme-select"]');
    var areaSelectbox = selectDiv.querySelector('select[name="area-select"]');
    var indicatorSelectbox = selectDiv.querySelector('select[name="indicator-select"]');
    var textContainer = document.getElementById('geojson-text');
    textContainer.innerHTML = '<h2>Choose an area for inspection</h2><p>Make a selection by clicking on an area of interest on the map.</p>';
    themeName = themeSelectbox.value;
    areaName = areaSelectbox.value;
    indicatorName = indicatorSelectbox.value;
    
    map.removeLayer(geoJSONLayer);
    fileName = '../data/' + themeName + '/' + areaName + ' - ' + indicatorName;
    console.log(fileName);
    geoJSONLeafletPromise(fileName);
}, false);



