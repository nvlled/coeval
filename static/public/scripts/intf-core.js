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

		var postdb = opts.db;
		if (postdb) {
			console.assert(typeof postdb.get==="function", "postdb interface");
			console.assert(typeof postdb.set==="function", "postdb interface");
			this.postdb = postdb;
		} else {
			this.postdb = new PostDB(this);
		}

		if (typeof opts.parsePostIds === "function")
			this.parsePostIds = opts.parsePostIds;

		this.hooks = opts.hooks || {};
		this.lastCreatedPost = null;
		this.prevChildId = {};
	}

	var M = Module.prototype;

	M.getPost = function(id) {
		return this.postdb.get(id);
	}

	M.firstchild = function(post) {
		return this.getPost(post.firstchildId);
	}

	M.children = function(post) {
		var childs = [];
		var child = this.firstchild(post);
		var firstchild = child;
		while (child) {
			childs.push(child);
			child = this.nextsib(child, post.id);
			if (firstchild == child)
				break;
		}
		return childs;
	}

	M.childrenIds = function(post) {
		return this.children(post)
			.map(function(post) {
				return post.id;
			})
	}

	M.newModule = function(opts) {
		return new Module(opts);
	}

	M.hook = function(name /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 1);
		var fn = this.hooks[name];
		if (typeof fn === "function")
			fn.apply(this, args);
	}

	M.newPost = function(data) {
		var post = {
			id:        data.id.toString(),
			body:	   data.body,
			norder:    {nextId:  null, prevId: null},
			sib:       {nextId:  {},   prevId: {}},
			page:	   {start: null, end: null},
			nextpostId:  null,
			prevpostId:  null,
			indented:  false,
			parentIds: this.parsePostIds(data.body),
			firstchildId: null,
			lastchildId:  null,
			numReplies: 0,
			inNorder:   true,
			// I relied too much on linked lists
			// Fix: Add some structure
		}

		var prevpost = this.lastCreatedPost;
		if (prevpost) {
			this.setPrevNorder(post, prevpost);
			this.setNextNorder(prevpost, post);
		}

		this.lastCreatedPost = post;
		this.postdb.set(post.id, post);
		this.linksToPosts(post);

		return post;
	}

	M.linksToPosts = function(post) {
		var pids = post.parentIds;
		pids.forEach(function(pid) {
			// Just assign a blank object
			// to avoid checking for nulls
			var parent = this.getPost(pid);
			console.assert(parent);

			var post1 = this.getPost(this.prevChildId[pid]);
			var post2 = post;

			if (post1) {
				this.setNextSib(post1, pid, post2);
				this.setPrevSib(post2, pid, post1);
			} else if (parent) {
				parent.firstchildId = post2.id;
				parent.lastchildId = post2.id;
			}
			parent.numReplies++;
			console.assert(parent.firstchildId);

			var firstchild = this.firstchild(parent);
			this.setNextSib(post2, pid, firstchild);
			this.setPrevSib(firstchild, pid, post2);

			this.prevChildId[pid] = post2.id;
		}.bind(this));
	}

	M.parsePostIds = (function() {
		var pat = />>\d+/g;
		return function (text) {
			var matches = text.match(pat);
			if (!matches)
				return [];
			return matches.map(function(s) {
				return s.slice(2); // remove trailing >>
			});
		}
	})();

	M.createLinkHandler = function(postlink) {
		return function() {
			var postmap = this.mapPostId(postlink);
			this.visitLink(postmap);
			return false;
		}
	}

	M.getSiblings = function(post, pid) {
		var posts = [];
		while(post) {
			posts.push(post);
			post = this.nextsib(post, pid);
		}
		return posts;
	}

	M.mapPostId = function(postlink) {
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

	M.attachPosts = function(linktype, parent, post) {
		if (parent.nextpost() == post && linktype == "parent")
			return;

		this.restoreSupthread(parent);
		this.clearSubthread(parent);

		if (!this.isIndented(post) && parent.nextpost() == post)
			this.attachSiblings(parent, post);
		else if (this.isIndented(post) || this.isInNorder(post))
			this.attachSiblings(parent, post);
		else
			this.attachSubthread(parent, post);

		// Parents are always undented
		this.undent(parent);
	}

	M.relocateAfter = function(post, dest) {
		this.setNextPost(dest, post);
		this.setPrevPost(post, dest);
		this.hook("relocateAfter", post, dest);
		post.inNorder = false;
	}

	M.attachSubthread = function(parent, post) {
		var post1 = parent;
		var post2 = post;
		console.log("**attaching subthread", post1.id, "->", post2.id);

		while (post2) {
			this.relocateAfter(post2, post1);
			post1 = post2;
			post2 = post2.nextpost();
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

			post1 = post2;
			post2 = this.nextsib(post2, parent.id);
			i++;
			if (start == post2)
				break;
		}
		parent.page.start = post;
		parent.page.end = post2;
	}

	M.attachToParent = function(post, parent) {
		console.assert(this.isChildOf(post, parent),
			"must attach");
		if (this.isInNorder(post)) {
			this.attachSiblings(parent, post);
		}
		parent.inNorder = false;
	}

	M.visitParent = function(postlink) {
		console.log("**visiting parent", postlink)
		var parent = postlink.targetPost;
		var post = postlink.sourcePost;
		this.attachToParent("parent", post, parent);
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
		this.hook("visitLink", postlink);
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
		this.setNextPost(post, null);
		this.setPrevPost(post, null);
		post.inNorder = true;
	}

	M.clearSubthread = function(post) {
		post = this.nextpost(post);
		// restore subthreads to normal order
		while(post) {
			var next = this.nextpost(post);
			this.undent(post);
			this.restoreNorder(post);
			post = next;
		}
	}

	M.getSubthread = function(post) {
		var subt = [];
		while (post) {
			subt.push(post);
			post = this.nextpost(post);
		}
		return subt;
	}

	M.getSubthreadIds = function(post) {
		return this.getSubthread(post)
			.map(function(post) { return post.id });
	}

	M.restoreSupthread = function(post) {
		var nextpost = post;
		var prev;
		post = post.prevpost();
		while(post && this.isIndented(post)) {
			prev = post.prevpost();
			this.undent(post);
			this.restoreNorder(post);
			post = prev;
		}
		if (prev) {
			console.log("suppost", prev.id, "->", nextpost.id);
			this.setNextPost(prev, nextpost);
		}
	}

	M.nextpost = function(post) {
		return this.getPost(post.nextpostId);
	}

	M.prevpost = function(post) {
		return this.getPost(post.prevpostId);
	}

	M.nextnorder = function(post) {
		return this.getPost(post.norder.nextId);
	}

	M.prevnorder = function(post) {
		return this.getPost(post.norder.prevId);
	}

	M.nextsib = function(post, pid) {
		return this.getPost(post.sib.nextId[pid]);
	}

	M.prevsib = function(post, pid) {
		return this.getPost(post.sib.prevId[pid]);
	}

	M.setNextPost = function(post, next) {
		console.assert(post != next);
		post.nextpostId = next.id;
		this.hook("setNextPost", post, next);
	}

	M.setPrevPost = function(post, prev) {
		console.assert(post != prev);
		post.prevpostId = prev.id;
		this.hook("setPrevPost", post, prev);
	}

	M.setNextNorder = function(post, next) {
		console.assert(post != next);
		post.norder.nextId = next.id;
		this.hook("setNextNorder", post, next);
	}

	M.setPrevNorder = function(post, prev) {
		console.assert(post != prev);
		post.norder.prevId = prev.id;
		this.hook("setPrevNorder", post, prev);
	}

	M.setNextSib = function(post, pid, next) {
		post.sib.nextId[pid] = next.id;
	}

	M.setPrevSib = function(post, pid, prev) {
		post.sib.prevId[pid] = prev.id;
	}

	M.isInNorder = function(post) /*bool*/ {
		return post.inNorder;
	}

	M.isIndented = function(post) /*bool*/ {
		return post.indented;
	}

	M.isSubthreadRoot = function(post) /*bool*/ {
		return !this.isInNorder(post) && !this.prevpost(post);
	}

	M.isChildOf = function(post, parent) /*bool*/ {
		return post.parentIds.indexOf(parent.id) >= 0;
	}

	M.undent = function(post) {
		post.indented = false;
		this.hook("undent", post);
	}

	M.indent = function(post) {
		post.indented = true;
		this.hook("indent", post);
	}

	root.printSubthread = function(post) {
		while(post) {
			console.log("subt>", post.id);
			post = this.nextpost(post);
		}
	}

	function PostDB(mod) {
		this.mod = mod;
		this._db = {};
	}
	PostDB.prototype.get = function(id) {
		return this._db[id];
	}
	PostDB.prototype.set = function(id, post) {
		this._db[id] = post;
	}
	PostDB.prototype.print = function(id, post) {
		var posts = [];
		for (var k in this._db)
			posts.push(this._db[k]);
		posts.sort(function(p1, p2) {
			return parseInt(p1.id) > parseInt(p2.id);
		});

		var intf = this.mod;
		for (var i in posts) {
			var post = posts[i];
			if (intf.isInNorder(post))
				printPost("-", post);
			else if (intf.isSubthreadRoot(post)) {
				printPost("|", post);
				var subt = intf.getSubthread(post);
				subt.slice(1).forEach(function(post) {
					printPost("|", post);
				})
			}
		}

		function printPost(prefix, post) {
			if (intf.isIndented(post))
				prefix = "  " + prefix;
			var len = (post.id+prefix).length;
			console.log(prefix, post.id,
						len > 5 ? "\t" : "\t\t",
						"ind="+bin(intf.isIndented(post)),
						"inn="+bin(intf.isInNorder(post)),
						"   ",
						"prv="+post.prevpostId,
						"nxt="+post.nextpostId
					   );
		}

		function bin(bool) { return bool ? 1 : 0; }
	}

	// TODO::
	// - showing of pages
	// - make pages cyclic
	//
	// - highlight target of childlink

})(this)



