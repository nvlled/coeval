(function(root) {

	var PAGE_SIZE = 3;

	try {
		// running on node
		module;
		module.exports = new Module();
	} catch(e) {
		// running on browser
		root.intf = new Module();
	}

	function Module(opts) {
		opts = opts || {};

		// default to using own's modules postdb
		this.getPost = opts.getPost;

		this.newNode = opts.newNode;
		this.postvisit = opts.postvisit;

		if (opts.parsePostIds )
			this.parsePostIds = opts.parsePostIds;

		this.hooks = opts.hooks;
		this.lastCreatedPost = null;
		this.prevChildId = {};
	}

	var M = Module.prototype;

	M.newModule = function(opts) {
		return new Module(opts);
	}

	M.hook = function(name /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 1);
		var fn = this.hooks[name];
		if (typeof fn === "function")
			fn.apply(null, args);
	}

	M.newPost = function(data) {
		// TODO: rename newNode
		var t = this.newNode(data);
		console.assert(newNode, "need a node creator");
		return {
			id:		   data.id,
			node:	   t.node,
			norder:    {next:  null, prev: null},
			sibling:   {next:  null, prev: null},
			page:	   {start: null, end:  null},
			nextpost:  null,
			prevpost:  null,
			indented:  false,
			parentIds: this.parsePostIds(data.body),
			prevSib:   {},
			nextSib:   {},
			firstchild: null,
			lastchild:  null,
			// I relied too much on linked lists
			// Fix: Add some structure
		}
	}

	M.parsePostIds = (function() {
		var pat = />>\d+/g;
		return function (text) {
			text.match(pat).map(function(s) {
				return s.slice(2);
			});
		}
	})();

	M.createLinkHandler = function(postlink) {
		return function() {
			var postmap = this.mapPostId(postlink);
			this.visitLink(postmap);
			if (postvisit)
				postvisit(postmap);
			return false;
		}
	}

	M.getSiblings = function(post, pid) {
		var posts = [];
		while(post) {
			posts.push(post);
			post = post.nextSib[pid];
		}
		return posts;
	}

	M.mapPostId = function(postlink, getPost) {
		return {
			type:		postlink.type,
			targetPost: getPost(postlink.targetId),
			sourcePost: getPost(postlink.sourceId),
		}
	}

	M.childlink = function(targetId, sourceId) {
		return {
			type:		"child",
			targetId: targetId,
			sourceId: sourceId,
		}
	}

	M.parentlink = function(targetId, sourceId) {
		return {
			type:		"parent",
			targetId: targetId,
			sourceId: sourceId,
		}
	}

	M.insertAfter = function(insertedNode, node) {
		var parentNode = node.parentNode;
		parentNode.insertBefore(insertedNode, node.nextSibling)
	}

	M.insertBefore = function(insertedNode, node) {
		var parentNode = node.parentNode;
		parentNode.insertBefore(insertedNode, node);
	}

	M.appendChild = function(parent, node) {
		parent.appendChild(node);
	}

	M.attachPosts = function(linktype, parent, post) {
		if (parent.nextpost == post && linktype == "parent")
			return;

		this.restoreSupthread(parent);
		this.clearSubthread(parent);

		if (!this.isIndented(post) && parent.nextpost == post)
			this.attachSiblings(parent, post);
		else if (this.isIndented(post) || inNorder(post))
			this.attachSiblings(parent, post);
		else
			this.attachSubthread(parent, post);

		// Parents are always undented
		this.undent(parent);
	}

	M.relocateAfter = function(post, dest) {
		this.setNextPost(dest, post);
		this.setPrevPost(post, dest);
		this.hook("relocateAfter", post2, post1);
	}

	M.attachSubthread = function(parent, post) {
		var post1 = parent;
		var post2 = post;
		console.log("**attaching subthread", post1.id, "->", post2.id);

		while (post2) {
			//this.insertAfter(post2.node, post1.node);
			//this.setNextPost(post1, post2);
			//post2.prevpost = post1;
			this.relocateAfter(post2, post1);
			post1 = post2;
			post2 = post2.nextpost;
		}
	}

	M.attachSiblings = function(parent, post) {
		var post1 = parent;
		var post2 = post;
		var start = post2;
		console.log("**attaching siblings", post1.id, "->", post2.id);

		var i = 0;
		while (i < PAGE_SIZE) {
			// Post in pages are always indented
			this.indent(post2);

			this.relocateAfter(post2, post1);
			//this.insertAfter(post2.node, post1.node);
			//this.setNextPost(post1, post2);
			//post2.prevpost = post1;

			post1 = post2;
			post2 = post2.nextSib[parent.id];
			i++;
			if (start == post2)
				break;
		}
		parent.page.start = post;
		parent.page.end = post2;
	}

	M.visitParent = function(postlink) {
		console.log("**visiting parent", postlink)
		var parent = postlink.targetPost;
		var post = postlink.sourcePost;
		this.attachPosts("parent", parent, post);
	}

	M.visitChild = function(postlink) {
		console.log("**visiting child", postlink);
		var child = postlink.targetPost;
		var post = postlink.sourcePost;
		attachPosts("child", post, child);
	}

	// Connects the post (or subthread)
	// refered to by postlink.sourceId to the
	// post refered to by the postlink.targetId
	M.visitLink = function(postlink) {
		switch(postlink.type) {
			case "parent" : this.visitParent(postlink); break;
			case "child"  : this.visitChild(postlink); break;
		}
	}

	M.nextPage = function(post) {
		if (this.isUndented(post)) {
			var child = post.page.end;
			var next = child.sibilings.next;
			if (next) { // avoid showing a blank page
				this.attachSiblings(post, next); // exclude child
			}
		}
	}

	M.prevPage = function(post) {
		if (this.isUndented(post)) {
			var child = post.page.start;
			// TODO: Create attachSiblings that goes backwards
			var i = 0;
			var prev = child.siblings.prev;
			while (i < PAGE_SIZE) {
				if (!prev.siblings.prev)
					break;
				prev = prev.siblings.prev;
				i++;
			}
			if (prev) {
				this.attachSiblings(post, next);
			}
		}
	}

	M.restoreNorder = function(post) {
		console.log("**restoring norder", post);

		 this.hook("restoreNorder", post);
		 //var prev = post.norder.prev;
		 //var next = post.norder.next;
		//while(true) {
		//	if (prev) {
		//		if (this.inNorder(prev)) {
		//			this.insertAfter(post.node, prev.node);
		//			break;
		//		}
		//		prev = prev.norder.prev;
		//	} else if (next) {
		//		next = next.norder.next;
		//		if (this.inNorder(next)) {
		//			this.insertBefore(post.node, next.node);
		//			break;
		//		}
		//	} else {
		//		var node = post.node;
		//		this.appendChild(node.parentNode, node);
		//		break;
		//	}
		//}

		this.setNextPost(post, null);
		post.prevpost = null;
	}

	M.clearSubthread = function(post) {
		post = post.nextpost;
		// restore subthreads to normal order
		while(post) {
			var next = post.nextpost;
			this.undent(post);
			this.restoreNorder(post);
			post = next;
		}
	}

	M.restoreSupthread = function(post) {
		var nextpost = post;
		var prev;
		post = post.prevpost;
		while(post && this.isIndented(post)) {
			prev = post.prevpost;
			this.undent(post);
			this.restoreNorder(post);
			post = prev;
		}
		if (prev) {
			console.log("suppost", prev.id, "->", nextpost.id);
			prev.nextpost = nextpost;
		}
	}

	M.setNextPost = function(post, next) {
		post.nextpost = next;
		this.hook("setNextPost", post, next);
		//if (next != null) {
		//	post.node.classList.add("subthread");
		//} else {
		//	post.node.classList.remove("subthread");
		//}
	}

	M.setPrevPost = function(post, prev) {
		post.prevpost = prev;
		this.hook("setPrevPost", post, prev);
	}

	M.inNorder = function(post) /*bool*/ {
		return post.nextpost == null;
	}

	M.isIndented = function(post) /*bool*/ {
		return post.indented;
	}

	M.undent = function(post) {
		post.indented = false;
		//post.node.classList.remove("indented");
		this.hook("undent", post);
	}

	M.indent = function(post) {
		post.indented = true;
		//post.node.classList.add("indented");
		this.hook("indent", post);
	}

	root.printSubthread = function(post) {
		while(post) {
			console.log("subt>", post.id);
			post = post.nextpost;
		}
	}

	// TODO::
	// - showing of pages
	// - make pages cyclic
	// - highlight target of childlink

})(this)





