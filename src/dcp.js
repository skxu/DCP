var options;
var breakfast;
var lunch;
var dinner;
var example =[];

$(document).ready(function() {
	$.getJSON('http://www.anyorigin.com/get?url=ocf.berkeley.edu/~eye/cal-dining/menu?date=2013-10-18&meal=lunch&location=foothill&callback=parseResponse()', function(data) {
		breakfast = data.contents.breakfast;

		//jsonp = data;
		console.log(data);
	});


	$.ajax({
		url: 'http://www.anyorigin.com/get?url=ocf.berkeley.edu/~eye/cal-dining/menu?date=2013-10-18&meal=lunch&location=foothill',
		dataType: 'jsonp',
		jsonpCallback: 'parseResponse',
	});
	
});

parseResponse = function(data) {
	breakfast = data.contents.breakfast;
	for (food in breakfast) {
		console.log(food);
		example.push(food);
	}
	$('#main').append('hello');
	console.log(example);
}