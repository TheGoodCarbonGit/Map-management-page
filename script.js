var serverName = 'https://mapdb-victest.australiaeast.cloudapp.azure.com/pins';

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
// fetch('https://tong-jt.github.io/map-test/plainlocations.json')
fetch(serverName, {
  method: "GET",
}).then(response => response.json())
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
    deleteHandler(id);
}

//Delete needs to also somehow remove the location from the locations[id]?
function deleteHandler(id){
    document.getElementById('deleteBtn').addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this entry?") == true) {
            const raw = "";
            const requestOptions = {
              method: "DELETE",
              body: raw,
              redirect: "follow"
            };
            fetch("https://mapdb-victest.australiaeast.cloudapp.azure.com/pins/"+id, requestOptions)
              .catch((error) => console.error(error));
            showFormReset();
          } else {
            console.log('You canceled a delete');
          }
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

//Reset form to initial stage
function showFormReset(){
    var form = document.getElementById('formcontents');
    resetSearch();
    form.reset();
    form.style.display = 'none';
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
        currentMarker = null;
    }
    fetchMethod = 'UNSELECTED';
}

//Reset form ready for populating to edit an existing location
function showFormEdit() {
    var form = document.getElementById('formcontents');
    var deleteBtn = document.getElementById('deleteBtn');
    form.style.display = 'block';
    deleteBtn.style.display = 'block';
    map1.invalidateSize();
    fetchMethod = 'EDIT';
}

//Reset form ready for adding a new location
function showFormAdd() {
    resetSearch();
    var form = document.getElementById('formcontents');
    var deleteBtn = document.getElementById('deleteBtn');
    form.style.display = 'block';
    deleteBtn.style.display = 'none';
    map1.invalidateSize();
    fetchMethod = 'ADD';
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
        currentMarker = null;
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

// SUBMIT BUTTON LISTENER
document.getElementById('submitBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var newname = document.getElementById('locationname').value;
    var type = document.getElementById('locationtype').value;
    var description = document.getElementById('descriptionfield').value;
    var formattedcoords = "";

    // Create list of errors
    var errors = [];
    if(currentMarker == null) {
        errors.push("CoordError: No location selected");
    } else {
        var coords = currentMarker.getLatLng();
        formattedcoords = "["+coords.lng+", "+coords.lat+"]";
    }

    var dataErrors = validateData(newname, type, description, formattedcoords);
    if (dataErrors.length > 0) {
        errors.push(dataErrors);
    }

    //Process list of errors
    if (errors.length > 0) {
        for(let formError of errors) {
            if(formError.startsWith("NameError")){
                document.getElementById('locationname').style.border = "2px solid red";
            }
            if(formError.startsWith("TypeError")){
                document.getElementById('locationtype').style.border = "2px solid red";
            }
            if(formError.startsWith("DescriptionError")){
                document.getElementById('descriptionfield').style.border = "2px solid red";
            }
            if(formError.startsWith("CoordError")){
                //highlight map border?
            }
            console.log(formError);
        }
        return; // returns if there are any errors so that no attempts to send data to API are made
    }

    if (checkIfEmpty(description)) {
        switch (description){
            case "Good Friend":
                description =  "Our Good Friends contribute to on-the-ground, collaborative, and circular community projects creating long-term carbon sinks, all over New Zealand.";
                break;
            case "Project":
                description = "We collaborate with good people delivering important school and community food-growing and conservation projects across New Zealand to provide a home for our biochar.";
                break;
            case "Carbon Farmer":
                description = "Working around New Zealand, our carbon farmers save green waste from re-emitting carbon to the atmosphere by converting it to biochar.";
                break;
            case "Donor":
                description = "Our donors provide funding and support to implement projects across New Zealand.";
                break;
            case "Store":
                description = "Supporters of The Good Carbon Store provide funding to implement projects across New Zealand.";
                break;
        }
    }

    console.log(newname+type+description+formattedcoords);
    if (fetchMethod=='ADD'){
        const myHeaders = new Headers();
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Content-Type", "application/json");
        // const raw = JSON.stringify({
        //   "name": newname,
        //   "coordinates": formattedcoords,
        //   "category": type,
        //   "description": description
        // });

        const raw = JSON.stringify({
            name: newname,
            coordinates: [coords.lng, coords.lat],  
            category: type,
            description: description
        });
        console.log("SENT DATA : "+raw);
        // const raw = '{"name":"'+newname+'", "coordinates":'+formattedcoords+', "category": "'+type+'", "description": "'+description+'"}';
        fetch(serverName, {
            method: "POST",
            headers: myHeaders,
            body: raw
        })
        .then(response => response.json())
        .then(data => console.log("Success:", data))
        .catch(error => console.error("Error:", error));
        showFormReset();
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
            currentMarker = null;
        }
        resetSearch();
        form.reset();
        fetchMethod = 'UNSELECTED';
      } else {
        console.log('You canceled a cancel???');
      }
});

function validateData(newname, type, description, formattedcoords) {
    const errors = [];
    const nameErrors = validateNewName(newname);
    const typeErrors = validateType(type);
    const descriptionErrors = validateDescription(description);
    const coordErrors = validateCoords(formattedcoords);

    if (nameErrors.length > 0) { //checks length as empty arrays cannot be pushed
        errors.push(...nameErrors);
    }
    if (typeErrors.length > 0) {
        errors.push(...typeErrors);
    }
    if (descriptionErrors.length > 0) {
        errors.push(...descriptionErrors);
    }
    if (coordErrors.length > 0) {
        errors.push(...coordErrors);
    }
    return errors;
}

function validateNewName(newname) {
    var nameErrors = [];
    if (!checkIfEmpty(newname)) {
        nameErrors.push("NameError: Please enter a name")
    }
    if(newname.length > 50) {
        nameErrors.push("NameError: Name cannot be more than 50 characters");
    }
    return nameErrors;
}

function validateType(type) {
    var typeErrors = [];
    if (!checkIfEmpty(type)) {
        typeErrors.push("TypeError: Please select a category")
    }

    let validTypes = ["Good Friend", "Project", "Carbon Farmer", "Donor", "Store"];
    if (!(validTypes.includes(type))) {
        typeErrors.push("TypeError: Invalid type");
    }
    // Type errors go here
    return typeErrors;
}

function validateDescription(description) {
    var descriptionErrors = [];
    // Check description errors here
    if (checkIfEmpty(description)) {
        return [];
    }
    return descriptionErrors;
}

function validateCoords(formattedCoords) {
    var coordsErrors = [];
    // Check coords here
    if(formattedCoords.length !== 2){
        coordsErrors.push("CoordError: Given coordinate array was not length of 2");
    }
    for (var i = 0; i < formattedCoords.length; i++){
        var coord = formattedCoords[i];
        if(!(/^\d+(\.\d+)?$/.test(coord))) {
            coordsErrors.push("CoordError: Given coordinate was not numeric");
            break;
        }
    }
    let longitude = Number(formattedCoords[0]);
    let latitude = Number(formattedCoords[1]);
    if (longitude > 180 || longitude < -180) {
        coordsErrors.push("CoordError: Longitude not within range");
    }
    if (latitude > 90 || latitude< -90) {
        coordsErrors.push("CoordError: Latitude not within range");
    }
    return coordsErrors;
}

function checkIfEmpty(text) {
    const emptyPattern = /^\s*$/; //regex expression that is either empty or just whitespace
    return emptyPattern.test(text); //returns true if empty
}
