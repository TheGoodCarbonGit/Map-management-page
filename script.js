// Initialise the map
var map1 = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 3,
}).setView([-41.29012931030752, 174.76792012621496], 5);

var currentMarker;

//Adding marker on click 
function addMarkeronClick(e) {
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
    }
    coords = e.latlng;
    currentMarker = new L.Marker(coords, { draggable: true });
    map1.addLayer(currentMarker);
    currentMarker.on('dragend', function (e) {
    console.log(currentMarker.getLatLng().lat + ", " + currentMarker.getLatLng().lng);
    });
}

map1.on('click', addMarkeronClick);

// Retrieve coordinates from search
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false
})
    .on('markgeocode', function (e) {
        if (currentMarker != null) {
            map1.removeLayer(currentMarker) //Removes last marker
        }
        coords = e.geocode.center;
        const newMarker = L.marker(coords, { draggable: true });
        map1.addLayer(newMarker);
        currentMarker = newMarker;
        map1.setView(coords, 14);
        currentMarker.on('dragend', function (e) {
        console.log(currentMarker.getLatLng().lat + ", " + currentMarker.getLatLng().lng);
        });
    })
    .addTo(map1);

var locations = {};
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
fetch('https://tong-jt.github.io/map-test/plainlocations.json')
    .then(response => response.json())
    .then(plainjson => {
        const data = convertToGeoJson(plainjson)
        // Parsing through each individual entry and extract info
        data.features.forEach(function (feature) {
            var id = feature.properties.id;
            var title = feature.properties.name;
            var category = feature.properties.category;
            var coordinates = feature.geometry.coordinates;
            locations[id] = {
                properties: feature.properties,
                coordinates: [coordinates[1], coordinates[0]]
            };
            // Append the dynamic content (title and category) to the selectiondiv
            $(".selectiondiv").append('<div id="' + id + '" class="locationdiv"><div class="locationtitle">' + title + '</div>' + category + '</div>');
            const locationSection = document.getElementById(id);
            locationSection.addEventListener('click', function () {
                showFormEdit();
                openForm(locations[id]);
            });
            const addbtn = document.getElementById('addbtn');
            addbtn.addEventListener('click', function () {
                showFormAdd();
            });
        });

    })
    .catch(error => console.error('Error loading GeoJSON:', error));

function openForm(feature) {
    var id = feature.properties.id;
    var title = feature.properties.name;
    var category = feature.properties.category;
    var description = feature.properties.description;
    var coordinates = feature.coordinates;
    if (currentMarker != null) {
        map1.removeLayer(currentMarker);
    }
    $(locationname).val(title);
    $(locationtype).val(category);
    //Force dropdown to register update with safari bug
    $(locationtype).focus().blur();
    $(descriptionfield).val(description);
    var marker = L.marker(coordinates, { draggable: true }).addTo(map1);
    currentMarker = marker;
    currentMarker.on('dragend', function (e) {
    console.log(currentMarker.getLatLng().lat + ", " + currentMarker.getLatLng().lng);
    });
}

// Converts plainJSON to a GeoJSON
function convertToGeoJson(plain) {
    const geoJSON = {
        type: "FeatureCollection",
        features: plain.map(site => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: site.coordinates
            },
            properties: {
                id: site.id,
                name: site.name,
                description: site.description,
                category: site.category
            }
        }))
    };
    return geoJSON;
}

let fetchMethod = 'UNSELECTED';

function showFormEdit() {
    var form = document.getElementById('formcontents');
    var deleteBtn = document.getElementById('deleteBtn');
    form.style.display = 'block';
    deleteBtn.style.display = 'block';
    map1.invalidateSize();
    fetchMethod = 'EDIT';

}

function showFormAdd() {
    resetSearch()
    var form = document.getElementById('formcontents');
    var deleteBtn = document.getElementById('deleteBtn');
    form.style.display = 'block';
    deleteBtn.style.display = 'none';
    map1.invalidateSize();
    fetchMethod = 'ADD';
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
    }
    form.reset();
}

function handleSearch() {
  var query = document.getElementById('search-bar').value.toLowerCase();

  if (query !== '') {
    var matches = Object.keys(locations).filter(function(id) {
      return locations[id].properties.name.toLowerCase().includes(query);
    });

    $(".selectiondiv").empty();

    if (matches.length > 0) {
      matches.forEach(function(match) {
        var location = locations[match];
        var markerPoint = location.properties;

        var resultItem = document.createElement('div');
        resultItem.id = match;
        resultItem.className = 'locationdiv';

        var titleElement = document.createElement('div');
        titleElement.className = 'locationtitle';
        titleElement.textContent = markerPoint.name;
        resultItem.appendChild(titleElement);

        var categoryElement = document.createElement('div');
        categoryElement.className = 'category';
        categoryElement.textContent = markerPoint.category;
        resultItem.appendChild(categoryElement);

        resultItem.addEventListener('click', function() {
          showFormEdit(); 
          openForm(locations[match]);
        });

        $(".selectiondiv").append(resultItem);
      });
    } else {
      var noResultsItem = document.createElement('div');
      noResultsItem.className = 'search-result-item';
      noResultsItem.textContent = 'No results found';
      $(".selectiondiv").append(noResultsItem);
    }
  }

  else {
    resetSearch();
  }
}

function resetSearch() {
  $(".selectiondiv").empty();
  $("#search-bar").val("");
  Object.keys(locations).forEach(key => {
    var feature = locations[key];
    var id = feature.properties.id;
    var title = feature.properties.name;
    var category = feature.properties.category;

    var resultItem = document.createElement('div');
    resultItem.id = id;
    resultItem.className = 'locationdiv';

    var titleElement = document.createElement('div');
    titleElement.className = 'locationtitle';
    titleElement.textContent = title;
    resultItem.appendChild(titleElement);

    var categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    categoryElement.textContent = category;
    resultItem.appendChild(categoryElement);

    resultItem.addEventListener('click', function() {
      showFormEdit(); 
      openForm(locations[id]);
    });

    $(".selectiondiv").append(resultItem);
  });
}

document.getElementById('submitBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var name = document.getElementById('locationname').value;
    var type = document.getElementById('locationtype').value;
    var description = document.getElementById('descriptionfield').value;
    var coords = currentMarker.getLatLng();
    console.log(name+type+description+coords);
    if (fetchMethod=='ADD'){
//Fetch call for PUSH
    } else if (fetchMethod=='EDIT'){
//Fetch call for PUT
    }
});

document.getElementById('cancelBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var form = document.getElementById('formcontents');
    if (confirm("Are you sure you want to cancel?") == true) {
        form.style.display = 'none';
        console.log('You confirmed a cancel');
        if (currentMarker != null) {
            map1.removeLayer(currentMarker) //Removes last marker
        }
        resetSearch();
        form.reset();
        fetchMethod = 'UNSELECTED';
      } else {
        console.log('You canceled a cancel???');
      }
});

document.getElementById('deleteBtn').addEventListener('click', function (e) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this entry?") == true) {
// //Fetch call for DELETE
// form.reset();
      } else {
        console.log('You canceled a delete');
      }
});