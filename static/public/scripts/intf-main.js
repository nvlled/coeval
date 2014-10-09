(function(root) {

	// exports
	root.intfmain = {
		buildThread: buildThread,
		init: function() {
			initPostTempl();
		},
	}

	var postdb = {};
	function getPost(id) { return postdb[id] }
	root.getPost = getPost;

	var lib = intf.create({
		newNode: newPostNode,
		getPost: getPost,
		postvisit: function(postmap) {
			// TODO: Replace super magical string literals
			if (postmap.type == "parent") {
				var post = postmap.targetPost;
				post.node.scrollIntoView();
			}
		}
	});

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
			var parent = getPost(pid) || {};
			var post1 = prevSib[pid];
			var post2 = post;

			if (post1)
				post1.nextSib[pid] = post2;
			else
				parent.firstchild = post2;

			post2.prevSib[pid] = post1;
			post2.nextSib[pid] = parent.firstchild; // create circular list

			prevSib[pid] = post2;
			parent.lastchild = post2;
		});
	}

	var postTempl;
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

})(this);

