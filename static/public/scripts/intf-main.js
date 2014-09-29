
var postTempl;

this.addEventListener("load", init)

// change format to map
var samplePosts = [
	{ id: "100", body: "whatereyouworkinongg/" },
	{ id: "101", body: ">>100 Re-kernelling my gentoo in haskell" },
	{ id: "102", body: ">>100\n>Not using animu pic\n>twenty-14"  },
	{ id: "103", body: ">>102\nweaboo scum git out\n"  },
	{ id: "104", body: ">>102\nweaboo scum git out\n"  },
	{ id: "105", body: ">>102\nweaboo scum git out\n"  },
	{ id: "107", body: ">>102\nweaboo scum git out\n"  },
];

var postdb = {};

var lib = intf.create({
	newNode: newPostNode,
	getPost: getPost,
	postvisit: function(postmap) {
		if (postmap.type == "parent") {
			var post = postmap.targetPost;
			post.node.scrollIntoView();
		}
	}
});

function getPost(id) { return postdb[id] }

function init() {
	initPostTempl();

	buildThread(samplePosts, document.querySelector("#sample-posts"));

	var dptPosts = dpt.posts.map(fromChan);
	buildThread(dptPosts, document.querySelector("#chan-posts"));
}

function buildThread(posts, container) {
	if (!container)
		container = document.body;

	var postIds = [];
	posts.forEach(function(postData) {
		var post = lib.newPost(postData);
		postdb[post.id] = post;
		postIds.push(post.id);
		container.appendChild(post.node);
	});

	var prevSib = {};
	for (var i = 0; i < postIds.length; i++) {
		var prev = getPost(postIds[i-1]);
		var post = getPost(postIds[i]);
		var next = getPost(postIds[i+1]);

		post.norder.prev = prev;
		post.norder.next = next;

		linkToParentNodes(post)
		linkSiblings(prevSib, post);
	}
}

function init2() {
	initPostTempl();

	var postIds = [];
	posts.forEach(function(postData) {
		var post = lib.newPost(postData);
		postdb[post.id] = post;
		postIds.push(post.id);
		document.body.appendChild(post.node);
	});

	var prevSib = {};
	for (var i = 0; i < postIds.length; i++) {
		var prev = getPost(postIds[i-1]);
		var post = getPost(postIds[i]);
		var next = getPost(postIds[i+1]);

		post.norder.prev = prev;
		post.norder.next = next;

		linkToParentNodes(post)
		linkSiblings(prevSib, post);

	}
}

function linkToParentNodes(post) {
	post.parentIds.forEach(function(parentId) {
		var parentNode = document.getElementById("p"+parentId);
		var postlink = intf.childlink(post.id, parentId);
		if (parentNode) {
			addChildlink(parentNode, postlink);
		}
	});
}

function linkSiblings(prevSib, post) {
	var pids = post.parentIds;
	pids.forEach(function(pid) {
		var post1 = prevSib[pid];
		var post2 = post;
		post.parentIds.forEach(function(pid) {
			if (post1)
				post1.nextSib[pid] = post2;
			post2.prevSib[pid] = post1;
			prevSib[pid] = post2;
		});
	});
}

function initPostTempl() {
	postTempl = document.querySelector(".template .post");
	postTempl.querySelector(".post-body").innerHTML = "";
	postTempl.remove();
}

function addChildlink(postNode, postlink) {
	var node = createPostLinkNode(postlink.targetId, PlinkType.CHILD);
	node.onclick = lib.createLinkHandler(postlink);
	var replies = postNode.querySelector(".post-replies");
	replies.appendChild(node);
}

function newPostNode(data) {
	var postNode = postTempl.cloneNode(true);
	postNode.setAttribute("id", "p"+data.id);
	postNode.querySelector(".post-id").textContent = data.id;
	postNode.querySelector(".post-anchor").href = "#p"+data.id;
	var bodyNode = postNode.querySelector(".post-body");

	var parentIds = parsePostBody(data, bodyNode);

	return { node: postNode, parentIds: parentIds };
}

function createPostLinkNode(id, type, handler) {
	var a = document.createElement("a");
	a.href = '#p'+id;
	a.classList.add("postlink");
	a.classList.add(""+type);
	a.textContent = ">>"+id;
	a.onclick = handler;
	return a;
}

var PlinkType = {
	PARENT: "parent",
	CHILD: "child",
}

function br() {
	return document.createElement("br");
}

function meymey() {
	var span = document.createElement("span");
	span.classList.add("maymay-arrow");
	return span;
}

function maymayArrow(text) {
	var span = document.createElement("span");
	span.classList.add("maymay-arrow");
	span.textContent = text;
	return span;
}

function textNode(t) {
	return document.createTextNode(t)
}

function spanNode(t) {
	var span = document.createElement("span");
	span.innerHTML = t;
	return span
}

function parsePostBody(postData, node) {
	var parentIds = [];
	var lines = postData.body.split("\n");
	lines.forEach(function(line) {
		if (line[0] == '>' && line[1] != '>') {
			node.appendChild(maymayArrow(line.substr(0)));
			node.appendChild(br());
			// Fix: don't return, just add styling on the current line
			return;
		}
		var matched = false;
		var pat = /(.*)(>>\d+)(.*)/g;
		while(true) {
			var m = pat.exec(line);
			if (m == null)
				break;
			matched = true;
			var parentId = m[2].substr(2);
			var postlinkNode = createPostLinkNode(parentId, PlinkType.PARENT);

			var postlink = intf.parentlink(parentId, postData.id);
			postlinkNode.onclick = lib.createLinkHandler(postlink);

			parentIds.push(parentId)

			node.appendChild(textNode(m[1]));
			node.appendChild(postlinkNode);
			node.appendChild(textNode(m[3]));
		}
		if (!matched)
			node.appendChild(textNode(line));

		node.appendChild(br());
	});
	return parentIds;
}

var fromChan = (function() {
	var compat = /<a .*>&gt;&gt;(.*)<\/a>/g;
	var brpat = /<br>/g;
	var quotepat = /<span class="quote">&gt;(.*)<\/span>/g

	var decodeHTML = (function() {
		var node = document.createElement("div");
		return function(s) {
			node.innerHTML = s;
			//console.assert(node.childNodes.length <= 1);
			if (node.childNodes.length > 0) {
				var v = node.childNodes[0].nodeValue;
				if (v)
					return v;
			}
			return s;
		}
	})();

	return function (data) {
		var body = data.com.replace(compat, function(_, id) { return ">>"+id; });
		body = body.replace(brpat, "\n");
		body = body.replace(quotepat, function(_, quote) { return ">"+quote });
		return {
			id: data.no,
			body: decodeHTML(body),
		}
	}

})();


