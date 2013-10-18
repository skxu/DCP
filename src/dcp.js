

var DCP = (function() {
    var DEBUG = true;
    var location = 'crossroads';
    var menu = {
        "foothill": {
            "breakfast": [],
            "lunch": [],
            "dinner": [],
            "distance": 1,
            "score": 0
        },
        "crossroads": {
            "breakfast": [],
            "lunch": [],
            "dinner": [],
            "distance": 1,
            "score": 0
        },
        "cafe3": {
            "breakfast": [],
            "lunch": [],
            "dinner": [],
            "distance": 1,
            "score": 0
        },
        "clarkkerr": {
            "breakfast": [],
            "lunch": [],
            "dinner": [],
            "distance": 1,
            "score": 0
        }
    };

    var URI;
    var params;
    var best;
    var defaultData;
    var d = new Date();
    var map;
    var meCoords;
    var meAccuracy;
    var FAVORITE_WEIGHT = 3;
    var DISTANCE_WEIGHT = 1;
    var CROSSROADS_LAT = 37.866608;
    var CROSSROADS_LON = -122.256407;
    var FOOTHILL_LAT = 37.875365;
    var FOOTHILL_LON = -122.256042;
    var CAFE3_LAT = 37.867531;
    var CAFE3_LON = -122.259604;
    var CLARKKERR_LAT = 37.863711;
    var CLARKKERR_LON = -122.249733;
    var fhCoords = new google.maps.LatLng(FOOTHILL_LAT,FOOTHILL_LON);
    var c3Coords = new google.maps.LatLng(CAFE3_LAT, CAFE3_LON);
    var ckCoords = new google.maps.LatLng(CLARKKERR_LAT, CLARKKERR_LON);
    var crCoords = new google.maps.LatLng(CROSSROADS_LAT, CROSSROADS_LON);
    var directionsDisplay =  new google.maps.DirectionsRenderer({suppressMarkers: true});
    var directionsService = new google.maps.DirectionsService();
    
    //formats to 'yyyy-MM-dd'
    formatDate = function() {
        d = new Date();
        var curr_year = d.getFullYear();
        var curr_month = d.getMonth() + 1; //months are 0 based...why?
        var curr_date = d.getDate();
        return curr_year + '-' + curr_month + '-' + curr_date;

    };

    //returns which meal is relevant for the current time of day
    getMeal = function() {
        d = new Date();
        var curr_hour = d.getHours();
        var curr_day = d.getDay();
        if (DEBUG) console.log('hour: ', curr_hour, 'day: ', curr_day);
        meal = '';
        if (curr_day != 0 && curr_day != 6) {//Weekends have different schedule
            if (DEBUG) console.log('Weekday');
            console.log(curr_hour);
            switch (true) { //TODO: refactor this into if-else for better performance
                case (curr_hour < 10):
                    meal = 'breakfast';
                    break;
                case (curr_hour >= 10 && curr_hour < 14):
                    meal = 'lunch';
                    break;
                case (curr_hour >= 14):
                    meal = 'dinner';
                    break;
            }
        } else {
            switch (true) {
                case (curr_hour < 16):
                    meal = 'lunch';
                    break;
                case (curr_hour >= 16):
                    meal = 'dinner';
                    break;
            }
        }
        return meal; 
    };
    
    URI = 'http://ocf.berkeley.edu/~eye/cal-dining/menu?';
    params = 'date=' + formatDate();
    

    
    

    $.getJSON("data/default.json", function(data) {
        defaultData = data;
    });

    calcScores = function(preference) {
        var meal = getMeal();
        var good_dishes;
        var favorite_dishes;
        if (DEBUG) {
            console.log('meal: ', meal);
        }

        if (preference == 'default') {
            good_dishes = defaultData.good_dishes;
            favorite_dishes = defaultData.favorite_dishes;
        }

        for (location in menu) {
            score = 0;
            if (DEBUG) {
                console.log('calcScores: location in menu: ',location);
                console.log('calcScores: menu.location.meal: ', menu[location][meal]);
            }
            for (dish in menu[location][meal]) {
                if (DEBUG) console.log('calcScores: dishes', menu[location][meal][dish]['name']);
                name = menu[location][meal][dish]['name'];
                if (good_dishes.indexOf(name) > -1) {
                    if (DEBUG) console.log('matched!');
                    score+=1;
                }
                if (favorite_dishes.indexOf(name) > -1) {
                    score+= 1 * FAVORITE_WEIGHT;
                }
            }

            distance = menu[location]['distance'];
            menu[location]['score'] = score * (1/(distance * DISTANCE_WEIGHT));

        }




    }


    createMap = function() {
        var mapCanvas = document.createElement('div');
        mapCanvas.id = 'mapCanvas';
        mapCanvas.style.height = '300px';
        mapCanvas.style.width = '900px';
        document.querySelector('map').appendChild(mapCanvas);
        var lowSat = [{featureType: "all",stylers: [{ saturation: -100 }]}];
        var mapOptions = {
            zoom: 15,
            styles: lowSat,
            center: meCoords,
            mapTypeControl: false,
            panControl: false,
            zoomControl: true,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false,
            navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map($('#mapCanvas')[0], mapOptions);

        var markerHere = new google.maps.Marker({
            position: meCoords,
            map: map,
            title:"You are within a "+meAccuracy+" meter radius of here"
        });

    };

    function calcRoute(start, end) {
        var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
                //strokeColor
            }
        });
    }

    positionHandler = function(pos) {
        if (DEBUG) {
            console.log("Position lat,long: " + pos.coords.latitude + "," + pos.coords.longitude);
        }
        meCoords = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        meAccuracy = pos.coords.accuracy;
    };

    positionError = function(msg) {

    };

    getCoords = function(location) {
        var coords;
        if (location == 'foothill') {
            coords = fhCoords;
        } else if (location == 'crossroads') {
            coords = crCoords;
        } else if (location == 'cafe3') {
            coords = c3Coords;
        } else if (location == 'clarkkerr') {
            coords = ckCoords;
        }
        return coords;
    };

    addMarker = function(location) {
        var coords = getCoords(location);    

        var marker = new google.maps.Marker({
            position: coords,
            map: map,
            title: location
        });
    };


    displayBest = function() {
        calcScores('default');
        best = '';
        bestScore = 0;
        for (location in menu) {
            if (DEBUG) console.log('score for ' + location, menu[location]['score']);
            if (menu[location]['score'] > bestScore) {
                best = location;
                bestScore = menu[location]['score']
            }
        }
        $("#best").text(best.charAt(0).toUpperCase() + best.slice(1));
        addMarker(best);
        calcRoute(meCoords, getCoords(best));
        directionsDisplay.setMap(null);
        
        directionsDisplay.polylineOptions = {
            strokeColor: '#00aba6',
            strokeOpacity: 0.8,
            strokeWeight: 5
            }; 

        directionsDisplay.setMap(map);
        return best;
    };

    displayMenus = function() {
        meal = getMeal();
        formatName = function(location) {
            for (dish in menu[location][meal]) {
                name = menu[location][meal][dish]['name'];
                $('#'+location+' ul').append('<li>'+name+'</li>');
            }
        };
        formatName('foothill');
        formatName('crossroads');
        formatName('cafe3');
        formatName('clarkkerr');
    };

    return {
        parseData: function(data) {
            if (DEBUG) {
                //console.log(data);
                console.log("foothill lunch contents: ", data.contents.lunch.foothill);
            }
            

            for (meal in data.contents) {
                if (DEBUG) console.log ('meal', data.contents[meal]);
                for (location in data.contents[meal]) {
                    for (dish in data.contents[meal][location]) {
                        dishObj = {
                            "name":dish,
                            "vegan":false,
                            "vegetarian":false,
                        }
                        for (attr in data.contents[meal][location][dish]) {
                            if (attr == 'vegan' || attr == 'vegetarian') {
                                dishObj[attr] = true;
                            }
                        }
                        menu[location][meal].push(dishObj);
                    }
                }
            }
            createMap();
            displayBest();
            $('#loading_container').hide();
            
            displayMenus();
            $('#main').fadeIn();

            if (DEBUG) console.log('menu: ', menu);
        },
        getURI: function() {
            d = new Date();
            if(DEBUG) console.log("URI + params: ", URI + params);
            return URI + params;
        },

        updateLocation: function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(positionHandler, positionError);
            } else {
                console.log('Geolocation not supported');
            }
        },

        getMeal: function() {
            return getMeal();
        },

        calcScores: function() {
            calcScores('default');
            return menu;
        },

        addMarker: function(coords, title) {
            if (DEBUG) addMarker('foothill');
            addMarker(coords, title);
        },

        getBest: function() {
            return displayBest();
        }

    };
})();



$(document).ready(function() {
    $.getJSON('http://whateverorigin.org/get?url=' + encodeURIComponent(DCP.getURI()) + '&callback=?', DCP.parseData);
    DCP.updateLocation();
    $('#main').hide();
});

