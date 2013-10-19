

var DCP = (function() {
    var DEBUG = true;
    var location = 'crossroads';
    var menu = {
        "foothill": {
            "breakfast": [],
            "lunch": [],
            "dinner": []
        },
        "crossroads": {
            "breakfast": [],
            "lunch": [],
            "dinner": []
        },
        "cafe3": {
            "breakfast": [],
            "lunch": [],
            "dinner": []
        },
        "clarkkerr": {
            "breakfast": [],
            "lunch": [],
            "dinner": []
        }
    };

    var URI;
    var params;
    var all;
    var d = new Date();

    var example =[];


    //formats to 'yyyy-MM-dd'
    formatDate = function() {
        var curr_year = d.getFullYear();
        var curr_month = d.getMonth() + 1; //months are 0 based...why?
        var curr_date = d.getDate();
        return curr_year + '-' + curr_month + '-' + curr_date;

    };

    //returns which meal is relevant for the current time of day
    getMeal = function() {
        var curr_hour = d.getHours();
        var curr_day = d.getDay();
        console.log(curr_day);
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
                case (curr_hour < 4):
                    meal = 'lunch';
                    break;
                case (curr_hour >= 4):
                    meal = 'dinner';
                    break;
            }
        }
        return meal; 
    };
    
    URI = 'http://ocf.berkeley.edu/~eye/cal-dining/menu?';
    params = 'date=' + formatDate();
    

    positionHandler = function(position) {
        if (DEBUG) {
            console.log("Position lat,long: " + position.coords.latitude + "," + position.coords.longitude);
        }
    };

    positionError = function(msg) {

    };

    return {
        parseData: function(data) {
            if (DEBUG) {
                //console.log(data);
                console.log("foothill lunch contents: ", data.contents.lunch.foothill);
            }
            
            for (meal in data.contents) {
                console.log (data.contents[meal]);
                for (location in data.contents[meal]) {
                    for (dish in data.contents[meal][location]) {
                        menu[location][meal].push(dish);
                    }
                }

            }
            
            $('#main').append('hello world');
            $('#loading_container').hide();

            if (DEBUG) console.log('menu: ', menu);
        },
        getURI: function() {
            d = new Date();
            console.log(URI + params);
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
            d = new Date();
            return getMeal();
        },

        setLocation: function(loc) {
            location = loc;
        },

        getLocation: function() {
            return location;
        }
    };
})();



$(document).ready(function() {
    $.getJSON('http://whateverorigin.org/get?url=' + encodeURIComponent(DCP.getURI()) + '&callback=?', DCP.parseData);
    DCP.updateLocation();
});

