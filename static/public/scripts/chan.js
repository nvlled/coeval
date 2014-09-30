(function() {

	this.addEventListener("load", function() {
		intfmain.init();
		initForm();
	});

	function buildThread(posts) {
	}

	var sel = function(s, node) {
		if (!node)
			node = document;
		return node.querySelector(s);
	}
	this.sel = sel;

	function initForm() {
		var form = sel("#board-form");
		var info = sel("#info");
		var bid = sel("#bid");
		var tid = sel("#tid");

		var button = sel("button", form);
		button.onclick = function() {
			bid.value = bid.value.trim();
			tid.value = tid.value.trim();

			var url
			if (!bid.value || !tid.value) {
				url = "/4chan/testdata";
				info.textContent = "Loading from testdata...";
			} else {
				url = "/4chan/"+bid.value+"/"+tid.value;
				info.textContent = "Loading";
			}

			fetchResource(url, function(text) {
				try {
					var t = JSON.parse(text);
					loadThread(t);
					info.textContent = "";
				} catch(e) {
					fetchFailed("not a json");
				}
			}, fetchFailed);
		}

		function fetchFailed(e) {
			info.textContent = "Thread not found";
			console.log("failed to fetch resource ", e);
		}
	}

	function loadThread(threadData) {
		var container = document.querySelector("#chan-posts");
		var dptPosts = threadData.posts.map(fromChan);
		intfmain.buildThread(dptPosts, container);
	}

	function createThreadURL(bid, tid) {
	}

	function fetchResource(url, succfn, errorfn) {
		console.log("*** fetching", url)
		var req = new XMLHttpRequest();
		req.open("GET", url);
		req.onload = function() {
			succfn(req.responseText);
		}
		req.addEventListener("error", errorfn);
		req.send();
	}

	var compat = /<a .*>&gt;&gt;(.*)<\/a>/g;
	var brpat = /<br>/g;
	var quotepat = /<span class="quote">&gt;(.*)<\/span>/g
	var decodeHTML = (function() {
		var node = document.createElement("div");
		return function(s) {
			node.innerHTML = s;
			if (node.childNodes.length > 0) {
				var v = node.childNodes[0].nodeValue;
				if (v)
					return v;
			}
			return s;
		}
	})();

	function fromChan(data) {
		var body = data.com || data.sub || "";
		body = body.replace(compat, function(_, id) { return ">>"+id; });
		body = body.replace(brpat, "\n");
		body = body.replace(quotepat, function(_, quote) { return ">"+quote });
		return {
			id: data.no,
			body: decodeHTML(body),
		}
	}


})();

