(function() {

	this.addEventListener("load", function() {
		intfmain.init();
		initForm();
		createSampleThread();

		var linkages = [["1006", "1002"], ["1010", "1004"], ["1009", "1003"], ["1005", "1002"], ["1002", "1001"]];
		linkages.forEach(function(link) {
			intf.attachToParent(intf.getPost(link[0]), intf.getPost(link[1]));
		});
	});

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
				} catch(e) {
					fetchFailed("not a json");
					return;
				}
				loadThread(t);
				info.textContent = "";
			}, fetchFailed);
		}

		function fetchFailed(e) {
			info.textContent = "Thread not found";
			console.log("failed to fetch resource ", e);
		}
	}

	function loadThread(threadData) {
		var container = document.querySelector("#thread-container");
		var dptPosts = threadData.posts.map(fromChan);
		container.innerHTML = "";
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

	function createSampleThread() {
		var posts = [
			{id: 1001, body:""},
			{id: 1002, body: ">>1001"},
			{id: 1005, body: ">>1002"},
			{id: 1006, body: ">>1002"},
			{id: 1003, body: ">>1001"},
			{id: 1009, body: ">>1003"},
			{id: 1004, body: ">>1001 >>1002 >>1005"},
			{id: 1010, body: ">>1004"},
			{id: 1011, body: ">>1004 >>1003"},
			{id: 1012, body: ">>1004"},
			{id: 1014, body: ">>1012 >>1006 >>1004"},
			{id: 1013, body: ">>1004"},
			{id: 1007, body: ">>1001 >>1002 >> 1003"},
			{id: 1008, body: ">>1001 >>1003 >>1014"},
			{id: 1015, body: ">>1008 >>1011"},
			{id: 1016, body: ">>1008"},
		];

		var container = document.querySelector("#thread-container");
		container.innerHTML = "";
		intfmain.buildThread(posts, container);
	}

})();







