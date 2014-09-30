(function() {


function fetchResource(url, fn) {
	var req = new XMLHttpRequest();
	req.open("GET", url);
	req.onload = function() {
		fn(req.responseText);
	}
	req.send();
}


})()
