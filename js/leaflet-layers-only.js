/* Layer control to add a pop up to the map, for the logo and a bit of div/style.
created by TF 28/06/17.
documentation for leaflet @ leafletjs.com
*/


// Extend the control within leaflet take note that this is the definition
//capitalise Control and InsightServiceInfoBox.
L.Control.InsightServiceInfoBox = L.Control.extend({
    onAdd: function(map) {
        var span = L.DomUtil.create('span');
        span.innerText = 'Insight Team';
        span.id = 'insight-service-span';

        var img = L.DomUtil.create('img');

        img.src = '../images/Graph.svg';
        img.id = 'insight-service-logo';
        img.alt = '';

        var p = L.DomUtil.create('p');
        p.id = 'insight-service-comment';
        p.innerHTML = 'Found a bug?<br/>Got an improvement?<br/>Want to work with us?<br/>';
        p.innerHTML += 'Say hello at <a href="mailto:insight@warwickshire.gov.uk">insight@warwickshire.gov.uk</a>';

        var div = L.DomUtil.create('div');
        div.id = 'insight-service-info-box';
        div.append(span, img, p);

        return div;
    },

    onRemove: function(map) {
        //Not required for this
    }
});

// Look at the lower case control, and lowercase insight
L.control.insightServiceInfoBox = function(options) {
    return new L.Control.InsightServiceInfoBox(options);
}

//Finally add it to the map - or you could do this in the main file.
// L.control.insightServiceInfoBox({ position : 'bottomleft'}).addTo(map);

L.Control.Key = L.Control.extend({
    onAdd: function(map) {
        var keySpan = L.DomUtil.create('span');
        keySpan.innerText = 'Key:';
        keySpan.id = 'key-span';

        // symbols reference the divs
        var symbol1 = L.DomUtil.create('div');
        symbol1.className = 'symbol';
        symbol1.id = 'gradient-symbol';
        var symbol3 = L.DomUtil.create('div');
        symbol3.className = 'symbol';
        symbol3.id = 'suppressed-data-symbol';
        var symbol4 = L.DomUtil.create('div');
        symbol4.className = 'symbol';
        symbol4.id = 'no-data-symbol';

        // legends reference the span, and is the text 
        var legend1 = L.DomUtil.create('span');
        legend1.innerText = 'Higher values';
        legend1.className = 'legend';
        legend1.id = 'high-legend';
        var legend2 = L.DomUtil.create('span');
        legend2.innerText = 'Lower values';
        legend2.className = 'legend';
        legend2.id = 'low-legend';
        var legend3 = L.DomUtil.create('span');
        legend3.innerText = 'Suppressed data';
        legend3.className = 'legend';
        var legend4 = L.DomUtil.create('span');
        legend4.innerText = 'No data';
        legend4.className = 'legend';
        legend4.id = 'no-data-legend';

        var container1 = L.DomUtil.create('div');
        var container2 = L.DomUtil.create('div');
        var container3 = L.DomUtil.create('div');
        var container4 = L.DomUtil.create('div');

        var containers = [container1, container2, container3];

        for (var i = 0; i < containers.length; i++) {
            containers[i].className = 'symbol-legend-container';
        }

        container1.appendChild(symbol1);
        container1.appendChild(legend1);
        container1.appendChild(legend2);
        container1.id = 'container-gradient';
        container2.appendChild(symbol3);
        container2.appendChild(legend3);
        container3.appendChild(symbol4);
        container3.appendChild(legend4);



        var keyContainer = L.DomUtil.create('div');
        keyContainer.id = 'key-container';
        keyContainer.append(
            keySpan,
            container1,
            container2,
            container3
        );
        
        return keyContainer;
    },
    onRemove: function(map) {
        // Not required for this
    }
})

L.control.key = function(options) {
    return new L.Control.Key(options);
}

// Line that needs to be added to the main promise file.
// L.control.key({ position : 'bottomleft'}).addTo(map);