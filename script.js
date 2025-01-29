// Initialise the map
var map1 = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 3, 
  }).setView([-41.29012931030752, 174.76792012621496], 5);

  var geocoder = L.Control.geocoder({
  })
    .on('markgeocode', function(e) {
      coords = e.geocode.center;
      console.log(coords.lat + ", " + coords.lng)
    })
    .addTo(map1);
  
  var markerMap = {};
    // initialise lists of markers for clusters
  
  L.control.zoom({
    position: 'topright'
  }).addTo(map1);
  
  // Add the tiles (image of the maps)
  var lyr_streets = L.tileLayer('http://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      minZoom: 2,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  
  lyr_streets.addTo(map1);
  
  // Fetch the JSON from local file, parse through
  fetch('https://tong-jt.github.io/map-test/locations.json')
  .then(response => response.json())
  .then(data => {

    // Parsing through each individual entry and extract info
    data.features.forEach(function(feature) {
      var id = feature.properties.id;
      var coordinates = feature.geometry.coordinates;
      var title = feature.properties.name;
      var category = feature.properties.category;

      markerMap[id] = {
        properties: feature.properties
      };
      
      // Append the dynamic content (title and category) to the selectiondiv
      $(".selectiondiv").append('<div id="' + id + '" class="locationdiv"><strong>' + title + '</strong><br>' + category + '</div>');

      const locationSection = document.getElementById(id);
      
      locationSection.addEventListener('click', function() {
        console.log(id);
        openForm(markerMap[id].properties);
      });

      
    });

  })
  .catch(error => console.error('Error loading GeoJSON:', error));
  
  //Adding marker on click
  var clickMarker;
  
  function addMarkeronClick(e) {
    if(clickMarker != null) {
      map1.removeLayer(clickMarker)
    }
  
    clickMarker = new L.Marker(e.latlng, {draggable:true});
          map1.addLayer(clickMarker);
  }
  
  map1.on('click', addMarkeronClick);
  
  
  