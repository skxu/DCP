

var DCP = (function() {
    var DEBUG = true;
    var options;
    var breakfast;
    var lunch;
    var dinner;
    var URI = 'http://ocf.berkeley.edu/~eye/cal-dining/menu?date=2013-10-18&meal=lunch&location=foothill'
    var example =[];

    return {
        parseData: function(data) {
            console.log(DEBUG);
            console.log(data);
            breakfast = data.contents.breakfast;
            for (location in breakfast) {
                example.push(location);
                if (DEBUG) console.log(example);
            }
            $('#main').append('hello world');
        },
        URI: function() {
            return URI;
        }
    };
})();



$(document).ready(function() {
    $.getJSON('http://whateverorigin.org/get?url=' + encodeURIComponent(DCP.URI()) + '&callback=?', DCP.parseData);

});

