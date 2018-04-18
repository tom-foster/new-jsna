// attribution
var osAttribution = "Crown Copyright and database right " + (new Date().getFullYear()) + ". <a href='https://www.ordnancesurvey.co.uk/'>Ordnance Survey</a> 100019520.";
var blueSkyAttribution = "Aerial Photography: &copy; <a href='https://www.bluesky-world.com/'>Bluesky International Limited</a> 2013";

// add the layers
// Note that the layers are being loaded as tms
var DarkGreyscaleLayer = L.tileLayer('http://maps.warwickshire.gov.uk/gs/gwc/service/tms/1.0.0/{layers}{format}/{z}/{x}/{y}.png8', {
    layers : 'z_OS_Vector_Backdrop_Dark',
    format : '@UK_OSGB@png8',
    continousWorld : true,
    tms: true,
    attribution: osAttribution, 
});

var LightGreyscaleLayer = L.tileLayer('http://maps.warwickshire.gov.uk/gs/gwc/service/tms/1.0.0/{layers}{format}/{z}/{x}/{y}.png8', {
    layers : 'z_OS_Vector_Backdrop_Light',
    format : '@UK_OSGB@png8',
    continousWorld : true,
    tms: true,
    attribution: osAttribution, 
});

var noLayer = L.tileLayer('');

// Image overlays are being loaded as WMS, they are not being loaded as TMS files
// They are passed the transparent option true - which makes sense for an overlay!
var wardOverlay = L.tileLayer.wms('http://maps.warwickshire.gov.uk/gs/ows', {
    layers : 'Public_Data_DB:OS_BD_WARDS_WSHIRE',
    format : 'image/png',
    transparent : true,
});

var districtOverlay = L.tileLayer.wms('http://maps.warwickshire.gov.uk/gs/ows', {
    layers : 'Public_Data_DB:OS_BD_DIST_BOR_WSHIRE',
    format : 'image/png',
    transparent : true,
})

var countyOverlay = L.tileLayer.wms('http://maps.warwickshire.gov.uk/gs/ows', {
    layers : 'Public_Data_DB:OS_BD_COUNTY_WSHIRE',
    format : 'image/png',
    transparent : true,
})

// The basemaps
var baseMaps = {
    "<span>Dark Greyscale Map</span>" : DarkGreyscaleLayer,
    "<span>Light Greyscale Map</span>" : LightGreyscaleLayer,
    "<span>None</span>" : noLayer,
};


//all overlays are added in this, it will get passed as a single entry to control.layers
// for styling purposes everything is getting added in spans (not technically needed)
var boundariesOverlays = {
    "<span>Ward Boundaries</span>" : wardOverlay,
    "<span>District and Borough Boundaries" : districtOverlay,
    // html added to start a line below it.
    "<span>County Boundary</span>" : countyOverlay,
};

// using leaflet tms instead of wms
var res = [2800,1400,700,350,175,84,42,21,11.2,5.6,2.8,1.4,0.7,0.35,0.14,0.07];

// Add the projection so that it works out of the box
var crs = new L.Proj.CRS("EPSG:27700", 
    "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs", {
        resolutions : res,
        // initial grid reference of the ONS
        origin : [0,0],
        // the binding box, note the first is reversed, since the tiles read
        //top to bottom in tms.
        bounds : L.bounds([700000, 0], [0, 1300000])
    });

var map = L.map('map', {
    crs : crs,
    continousWorld: false,
    worldCopyJump : false,
    center : [52.32180022064941, -1.5674963196593439],
    // maxZoom is set to 15, as there are only 16, resolutions.
    maxZoom : 15,
    zoom : 5,
    layers : [LightGreyscaleLayer, countyOverlay],
});

//add the controls to the map.
L.control.layers(baseMaps, boundariesOverlays).addTo(map);






// function onMapClick(e) {
//     alert("You clicked the map at " + e.latlng + 'e/n:' + britishNatGridProj(e.latlng.lng, e.latlng.lat));
//     console.log('e/n' + britishNatGridProj(e.latlng.lng, e.latlng.lat));
// }

// map.on('click', onMapClick);

//this is currently a duplicate of the the one in leaflet tools
// it doesn't need to be in this file.
function britishNatGridProj(long, lat) {
    //define the definition, and return it as easting and northing.
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");
    return proj4('EPSG:27700', [long, lat]);
}
