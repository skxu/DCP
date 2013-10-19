

var DCP = (function() {
    var DEBUG = true;
    var location = 'foothill';
    var mealChosen = '';
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
    var markersArray = [];
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
        return curr_year + '-' + ('0' + curr_month).slice(-2) + '-' + ('0' + curr_date).slice(-2);

    };

    //returns which meal is relevant for the current time of day
    getMeal = function() {
        if (mealChosen != '') {
            return mealChosen;
        }
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
    

    setMeal = function(meal) {
        mealChosen = meal;
    };

    URI = 'http://ocf.berkeley.edu/~eye/cal-dining/menu?';
    params = 'date=' + formatDate();
    

    
    

    $.getJSON("data/default.json", function(data) {
        defaultData = data;
    });
    var good_dishes;
    var favorite_dishes;
    calcScores = function(preference) {
        var meal = getMeal();
        
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
            if (menu[location][meal].length != 0) {
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
            }
            distance = menu[location]['distance'];
            menu[location]['score'] = score * (1/(distance * DISTANCE_WEIGHT));
        }
    }


    createMap = function() {
        var mapCanvas = document.createElement('div');
        mapCanvas.id = 'mapCanvas';
        mapCanvas.style.height = '300px';
        mapCanvas.style.width = '100%';
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

        

    };

    clearOverlays = function() {
      for (var i = 0; i < markersArray.length; i++ ) {
        markersArray[i].setMap(null);
      }
      markersArray = [];
    }

    calcRoute = function(start, end) {
        var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
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
        markersArray.push(marker);
    };

    upperCaseFirstChar = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

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

        $('#foothillCol').css("box-shadow", "0px 0px 0px #000");
        $('#crossroadsCol').css("box-shadow", "0px 0px 0px #000");
        $('#cafe3Col').css("box-shadow", "0px 0px 0px #000");
        $('#clarkkerrCol').css("box-shadow", "0px 0px 0px #000");
        
        if (best != '') {
            addMarker(best);
            calcRoute(meCoords, getCoords(best));
            directionsDisplay.setMap(null);
            $('#'+best+'Col').css("box-shadow", "0px 0px 15px rgb(140,160,100)");
        } else {
            best = 'All Closed!';
        }
        $("#best").text(upperCaseFirstChar(best));
        $('#header_text').remove();
        $('#header').append("<p id='header_text' align='center'>"+'</p>');
        $('#header_text').text(upperCaseFirstChar(getMeal()));
        
        directionsDisplay.polylineOptions = {
            strokeColor: '#00aba6',
            strokeOpacity: 0.8,
            strokeWeight: 5
            }; 

        directionsDisplay.setMap(map);

        return best;
    };

    var leftOption;
    var rightOption;

    setButtons = function() {
        
        $('#leftButton').click(function() {
            $('#main').fadeOut();
            $('#loading_container').fadeIn();
            setMeal(leftOption);
            window.setTimeout(resetMenus, 500);
            setButtons();
        });
        $('#rightButton').click(function() {
            $('#main').fadeOut();
            $('#loading_container').fadeIn();
            setMeal(rightOption);
            window.setTimeout(resetMenus, 500);
            setButtons();
        });
    };

    resetMenus = function() {
        $('tbody').empty();
        clearOverlays();
        displayBest();
        displayMenus();
        $('#loading_container').fadeOut('slow');
        $('#main').fadeIn('slow');
        setButtons();
    };

    //checks for duplicate DOM ids
    checkRepeat = function(id) {
        $('['+id+']').each(function() {
            var ids = $('['+id+'="'+this.id+'"]');
            if(ids.length>1 && ids[0]==this) {
                return true;
            } else {
                return false;
            }
        });
    };

    displayMenus = function() {
        meal = getMeal();
        if (meal == 'breakfast') {
            leftOption = 'dinner';
            rightOption = 'lunch';
        } else if (meal == 'lunch') {
            leftOption = 'breakfast';
            rightOption = 'dinner';
        } else {
            leftOption = 'lunch';
            rightOption = 'breakfast';
        }
        formatName = function(location) {
            for (dish in menu[location][meal]) {
                name = menu[location][meal][dish]['name'];
                var vegan = menu[location][meal][dish]['vegan'];
                var vegetarian = menu[location][meal][dish]['vegetarian'];
                if (favorite_dishes.indexOf(name) > -1) {
                    if (vegan === true && vegetarian === true) {
                        $('#'+location+' tbody').append("<tr><td class='favorite vegan'>"+name+'</td></tr>');
                    } else if (vegan === true) {
                        $('#'+location+' tbody').append("<tr><td class='favorite vegan'>"+name+'</td></tr>');    
                    } else if (vegetarian === true) {
                        $('#'+location+' tbody').append("<tr><td class='favorite vegetarian'>"+name+'</td></tr>');
                    } else {
                        $('#'+location+' tbody').append("<tr><td class='favorite'>"+name+'</td></tr>');
                    }
                } else if (good_dishes.indexOf(name) > -1) {
                    if (vegan === true && vegetarian === true) {
                        $('#'+location+' tbody').append("<tr><td class='good vegan'>"+name+'</td></tr>');
                    } else if (vegan === true) {
                        $('#'+location+' tbody').append("<tr><td class='good vegan'>"+name+'</td></tr>');    
                    } else if (vegetarian === true) {
                        $('#'+location+' tbody').append("<tr><td class='good vegetarian'>"+name+'</td></tr>');
                    } else {
                        $('#'+location+' tbody').append("<tr><td class='good'>"+name+'</td></tr>');
                    }
                } else {
                    if (vegan === true && vegetarian === true) {
                        $('#'+location+' tbody').append("<tr><td class='vegan'>"+name+'</td></tr>');
                    } else if (vegan === true) {
                        $('#'+location+' tbody').append("<tr><td class='vegan'>"+name+'</td></tr>');    
                    } else if (vegetarian === true) {
                        $('#'+location+' tbody').append("<tr><td class='vegetarian'>"+name+'</td></tr>');
                    } else {
                        $('#'+location+' tbody').append('<tr><td>'+name+'</td></tr>');
                    }
                }
            }
            if (menu[location][meal].length === 0) {
                $('#'+location+' tbody').append("<tr class='italic'><td>Closed</td></tr>");
            }
        };
        $('#leftButton').remove();
        $('#rightButton').remove();
        $('#leftOption').append("<a href='#' id='leftButton'><h2><span class='glyphicon glyphicon-chevron-left'></span>Show me "+leftOption+" instead</h2></a>");
        $('#rightOption').append("<a href='#' id='rightButton'><h2>Show me "+rightOption+" instead<span class='glyphicon glyphicon-chevron-right'></span></h2></a>");
        formatName('foothill');
        formatName('crossroads');
        formatName('cafe3');
        formatName('clarkkerr');

        $('#leftButton').click(function() {
            $('#main').fadeOut();
            $('#loading_container').fadeIn();
            setMeal(leftOption);
            window.setTimeout(resetMenus, 500);
            
        });
        $('#rightButton').click(function() {
            $('#main').fadeOut();
            $('#loading_container').fadeIn();
            setMeal(rightOption);
            window.setTimeout(resetMenus, 500);
        });

        var markerHere = new google.maps.Marker({
            position: meCoords,
            map: map,
            title:"You are within a "+meAccuracy+" meter radius of here"
        });
        markersArray.push(markerHere);
    };

    return {
        parseData: function(data) {
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
                                if (data.contents[meal][location][dish][attr] === true) {
                                    dishObj[attr] = true;
                                }
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
        },

        setMeal: function(meal) {
            setMeal(meal);
        }

    };
})();



$(document).ready(function() {
    $.getJSON('http://whateverorigin.org/get?url=' + encodeURIComponent(DCP.getURI()) + '&callback=?', DCP.parseData);
    DCP.updateLocation();
    $('#main').hide();
});

