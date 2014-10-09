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

	intf = intf.newModule({
		newNode: newPostNode,
		getPost: getPost,
		hooks: intfHooks,
	});

	var intfHooks = {
		visitLink: function(postlink) {
			if (postlink.type == "parent") {
				var post = postlink.targetPost;
				post.node.scrollIntoView();
			}
		},

		undent: function() {
			post.node.classList.remove("indented");
		},

		indent: function() {
			post.node.classList.add("indented");
		},

		relocateAfter: function(post, dest) {
			insertAfter(post.node, dest.node);
			post.node.classList.add("subthread");
		},

		restoreNorder: function(post) {
			var prev = post.norder.prev;
			var next = post.norder.next;
			while(true) {
				if (prev) {
					if (this.inNorder(prev)) {
						insertAfter(post.node, prev.node);
						break;
					}
					prev = prev.norder.prev;
				} else if (next) {
					next = next.norder.next;
					if (this.inNorder(next)) {
						insertBefore(post.node, next.node);
						break;
					}
				} else {
					var node = post.node;
					appendChild(node.parentNode, node);
					break;
				}
			}
			post.node.classList.remove("subthread");
		},
	}

	function buildThread(posts, container) {
		if (!container)
			container = document.body;

		posts.forEach(function(postData) {
			var post = intf.newPost(postData);
			post.node = newPostNode(data);

			postdb[post.id] = post;
			container.appendChild(post.node);

			// Assumes posts are created in order
			// E.g. all parents are already created before this one
			linkToParentNodes(post)
		});
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

	var postTempl;
	function initPostTempl() {
		postTempl = document.querySelector(".template .post");
		postTempl.querySelector(".post-body").innerHTML = "";
		postTempl.remove();
	}

	function addChildlink(postNode, postlink) {
		var node = createPostLinkNode(postlink.targetId, PlinkType.CHILD);
		node.onclick = intf.createLinkHandler(postlink);
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
				postlinkNode.onclick = intf.createLinkHandler(postlink);

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

	function insertAfter(insertedNode, node) {
		var parentNode = node.parentNode;
		parentNode.insertBefore(insertedNode, node.nextSibling)
	}

	function insertBefore(insertedNode, node) {
		var parentNode = node.parentNode;
		parentNode.insertBefore(insertedNode, node);
	}

	function appendChild(parent, node) {
		parent.appendChild(node);
	}

})(this);

