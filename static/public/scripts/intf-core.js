(function(root) {

	// exports
	root.intf = {
		childlink:	childlink,
		parentlink: parentlink,
		create: create,
		getSiblings: getSiblings,
	}

	var PAGE_SIZE = 3;

	//post {
	//	id int
	//	node HtmlNode
	//  norder  {next, prev} (never modified)
	//  page	{start, end}
	//  nextpost post
	//  indented
	//
	//	nextsib: {
	//		pid1: post1,
	//		pid2: post2,
	//		pid3: post3,
	//	}
	//  prevsib: {
	//		pid1: post1,
	//		pid2: post2,
	//  }
	//
	// pids: [post]
	// firstchild: post,
	// lastchild: post,
	//}

	//postlink {
	//	type string
	//	sourcePost post
	//	targetPost post
	//}

	function create(opts) {
		var newNode = opts.newNode;
		var getPost = opts.getPost;
		var postvisit = opts.postvisit;
		return {
			newPost: function(data) {
				// TODO: rename newNode
				var t = newNode(data);
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
					parentIds: t.parentIds,
					prevSib:   {},
					nextSib:   {},
					firstchild: null,
					lastchild:  null,
					// I relied too much on linked lists
					// Fix: Add some structure
				}
			},
			createLinkHandler: function(postlink) {
				return function() {
					var postmap = mapPostId(postlink, getPost)
					visitLink(postmap);
					if (postvisit)
						postvisit(postmap);
					return false;
				}
			}
		}

	}

	function getSiblings(post, pid) {
		var posts = [];
		while(post) {
			posts.push(post);
			post = post.nextSib[pid];
		}
		return posts;
	}

	function mapPostId(postlink, getPost) {
		return {
			type:		postlink.type,
			targetPost: getPost(postlink.targetId),
			sourcePost: getPost(postlink.sourceId),
		}
	}

	function childlink(targetId, sourceId) {
		return {
			type:		"child",
			targetId: targetId,
			sourceId: sourceId,
		}
	}

	function parentlink(targetId, sourceId) {
		return {
			type:		"parent",
			targetId: targetId,
			sourceId: sourceId,
		}
	}

	root.insertAfter = insertAfter;
	root.insertBefore = insertBefore;;

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

	function attachPosts(parent, post) {
		if (parent.nextpost == post)
			return;

		restoreSupthread(parent);
		restoreSubthread(parent);

		if (isIndented(post) || inNorder(post))
			attachSiblings(parent, post);
		else
			attachSubthread(parent, post);

		// Parents are always undented
		undent(parent);
	}

	function attachSubthread(parent, post) {
		var post1 = parent;
		var post2 = post;
		console.log("**attaching subthread", post1.id, "->", post2.id);

		while (post2) {
			insertAfter(post2.node, post1.node);
			setNextPost(post1, post2);
			post2.prevpost = post1;
			post1 = post2;
			post2 = post2.nextpost;
		}
	}

	function attachSiblings(parent, post) {
		var post1 = parent;
		var post2 = post;
		var start = post2;
		console.log("**attaching siblings", post1.id, "->", post2.id);

		var i = 0;
		while (i < PAGE_SIZE) {
			// Post in pages are always indented
			indent(post2);
			insertAfter(post2.node, post1.node);

			setNextPost(post1, post2);
			post2.prevpost = post1;
			post1 = post2;
			post2 = post2.nextSib[parent.id];
			i++;
			if (start == post2)
				break;
		}
		parent.page.start = post;
		parent.page.end = post2;
	}

	function visitParent(postlink) {
		console.log("**visiting parent", postlink)
		var parent = postlink.targetPost;
		var post = postlink.sourcePost;
		attachPosts(parent, post);
	}

	function visitChild(postlink) {
		console.log("**visiting child", postlink);
		var child = postlink.targetPost;
		var post = postlink.sourcePost;
		attachPosts(post, child);
	}

	// Connects the post (or subthread)
	// refered to by postlink.sourceId to the
	// post refered to by the postlink.targetId
	function visitLink(postlink) {
		switch(postlink.type) {
			case "parent" : visitParent(postlink); break;
			case "child"  : visitChild(postlink); break;
		}
	}

	function nextPage(post) {
		if (isUndented(post)) {
			var child = post.page.end;
			var next = child.sibilings.next;
			if (next) { // avoid showing a blank page
				attachSiblings(post, next); // exclude child
			}
		}
	}

	function prevPage(post) {
		if (isUndented(post)) {
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
				attachSiblings(post, next);
			}
		}
	}

	root.restoreNorder = restoreNorder;
	function restoreNorder(post) {
		console.log("**restoring norder", post);
		var prev = post.norder.prev;
		var next = post.norder.next;
		while(true) {
			if (prev) {
				if (inNorder(prev)) {
					insertAfter(post.node, prev.node);
					break;
				}
				prev = prev.norder.prev;
			} else if (next) {
				next = next.norder.next;
				if (inNorder(next)) {
					insertBefore(post.node, next.node);
					break;
				}
			} else {
				var node = post.node;
				appendChild(node.parentNode, node);
				break;
			}
		}
		setNextPost(post, null);
		post.prevpost = null;
	}

	root.restoreSubthread = restoreSubthread;
	function restoreSubthread(post) {
		post = post.nextpost;
		// restore subthreads to normal order
		while(post) {
			var next = post.nextpost;
			undent(post);
			restoreNorder(post);
			post = next;
		}
	}

	function restoreSupthread(post) {
		var nextpost = post;
		var prev;
		post = post.prevpost;
		while(post && isIndented(post)) {
			prev = post.prevpost;
			undent(post);
			restoreNorder(post);
			post = prev;
		}
		if (prev) {
			console.log("suppost", prev.id, "->", nextpost.id);
			prev.nextpost = nextpost;
		}
	}

	function setNextPost(post, next) {
		post.nextpost = next;
		if (next != null) {
			post.node.classList.add("subthread");
		} else {
			post.node.classList.remove("subthread");
		}
	}

	function inNorder(post) /*bool*/ {
		return post.nextpost == null;
	}

	function isIndented(post) /*bool*/ {
		return post.indented;
	}

	function undent(post) {
		post.node.classList.remove("indented");
		post.indented = false;
	}

	function indent(post) {
		post.node.classList.add("indented");
		post.indented = true;
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





