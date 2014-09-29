
var postTempl;

this.addEventListener("load", init)

// change format to map
var posts = [
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

var compat = /<a .*>&gt;&gt;(.*)<\/a>/g;
var brpat = /<br>/g;
var quotepat = /<span class="quote">&gt;(.*)<\/span>/g
function fromChan(data) {
	var body = data.com.replace(compat, function(_, id) { return ">>"+id; });
	body = body.replace(brpat, "\n");
	body = body.replace(quotepat, function(_, quote) { return ">"+quote });
	return {
		id: data.no,
		body: decodeHTML(body),
	}
}

function init() {
	initPostTempl();

	var posts = dpt.posts.map(fromChan);

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

	//parentIds.forEach(function(parentId) {
	//	var parentNode = document.getElementById("p"+parentId);
	//	var postlink = intf.childlink(data.id, parentId);
	//	if (parentNode) {
	//		addChildlink(parentNode, postlink);
	//	}
	//});

	return { node: postNode, parentIds: parentIds };
}

// newPost(data, newPostNode)

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


//function addToPostBodyNode(tokens, bodyNode) {
//	var node = bodyNode;
//	tokens.forEach(function(t) {
//		switch (t.tag) {
//			case "text": node.appendChild(textNode(t.value)); break;
//			case "id": {
//				var postlinkNode = createPostLinkNode(t.value, PlinkType.PARENT);
//				node.appendChild(postlinkNode);
//				break;
//			}
//			case "br": {
//				bodyNode.appendChild(node);
//				node = bodyNode;
//				node.appendChild(br());
//			}
//			case ">>": {
//				node = meyemey();
//			}
//		}
//	});
//}

//function parsePostBody(text) {
//	var tokens = [];
//	var parentIds = [];
//	var lines = text.split("\n");
//
//	return lines.map(function(line) {
//		var ts = [];
//		var matched = false;
//		var pat = /(.*)(>>\d+)(.*)/g;
//		while(true) {
//			var m = pat.exec(line);
//			if (m == null)
//				break;
//			matched = true;
//
//			var id = m[2].substr(2);
//			ts.push(_text(m[1]));
//			ts.push(_id(id));
//			ts.push(_text(m[2]));
//
//			parentIds.push(id);
//		}
//		if (!matched)
//			ts.push(_text(line))
//
//		if (line[0] == '>' && line[1] != '>') {
//			tokens.push(_style(ts));
//		} else {
//			tokens.concat(ts);
//		}
//
//		tokens.push(br());
//	});
//
//	function _text(v) { return {tag: "text", value: v}; }
//	function _id(v)	  { return {tag: "id",	 value: v}; }
//	function _br()	  { return {tag: "br",	 value: nil}; }
//	function _style(childs) { return {tag: ">>",   value: childs}; }
//
//	return { tokens: tokens, parentIds: parentIds };
//}





