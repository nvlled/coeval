"use strict";

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
        this.history = [];
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
            body:       data.body,
            norder:    {nextId:  null, prevId: null},
            sib:       {nextId:  {},   prevId: {}},
            page:       {start: null, end: null},
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
            if (!parent) {
                console.warn("parent ", pid, " of ", post.id, " not found ");
                return;
            }
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
        }.bind(this);
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
            type:        postlink.type,
            targetPost: this.getPost(postlink.targetId),
            sourcePost: this.getPost(postlink.sourceId),
        }
    }

    M.childlink = function(targetId, sourceId) {
        return {
            type:        "child",
            targetId: targetId,
            sourceId: sourceId,
        }
    }

    M.parentlink = function(targetId, sourceId) {
        return {
            type:        "parent",
            targetId: targetId,
            sourceId: sourceId,
        }
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
            this.undent(post);
            this.relocateAfter(post2, post1);
            post1 = post2;
            post2 = this.nextpost(post2);
        }
    }

    M.attachSiblings = function(parent, post) {
        var post1 = parent;
        var post2 = post;
        var start = post2;
        console.log("**attaching siblings", post1.id, "->", post2.id);

        var childset = {};
        var posts = [post1];
        var i = 0;

        childset[parent.id] = parent;
        while (i < PAGE_SIZE) {
            // Disregard undented posts
            // Note: result may be unexpected
            // when given an undented starting post.
            if (this.isIndented(post2) || this.isInNorder(post2)) {
                childset[post2.id] = post2;
                posts.push(post2);
            }

            post1 = post2;
            post2 = this.nextsib(post2, parent.id);
            i++; // Fix: This should be in the preceding if block
            if (start == post2)
                break;
        }

        for (i = 1; i < posts.length; i++) {
            post1 = posts[i-1];
            post2 = posts[i];

            var curparent = this.currentParent(post2);
            if (!curparent && !this.isInNorder(post2) && this.isUndented(post2)) {
                this.clearSubthread(post2, null, true);
            }
            if (parent != curparent) {
                this.detachChildren(post2, childset);
            }

            // * Do the two statements in the next loop block
            // * instead, since the html nodes end up
            // * being jumbled in order.
            //this.indent(post2);
            //this.relocateAfter(post2, post1);
        }

        for (i = 1; i < posts.length; i++) {
            post1 = posts[i-1];
            post2 = posts[i];

            this.indent(post2);
            this.relocateAfter(post2, post1);
        }
        // worst case: loop count = PAGE_SIZE*3
        // TODO: Reduce loop count

        parent.page.start = post;
        parent.page.end = post2;
    }

    M.currentParent = function(post) {
        post = this.prevpost(post);
        while(post && this.isIndented(post)) {
            post = this.prevpost(post);
        }
        return post;
    }

    M.isAncestor = function(post, precedingPost) {
        post = this.prevpost(post);
        while(post) {
            if (post == precedingPost)
                return true;
            post = this.prevpost(post);
        }
        return false;
    }

    M.isDescendant = function(post, succeedingPost) {
        post = this.prevpost(post);
        while(post) {
            if (post == succeedingPost)
                return true;
            post = this.prevpost(post);
        }
        return false;
    }

    M.isSiblings = function(post1, post2) {
        var curParent = this.currentParent.bind(this);
        var parent1 = curParent(post1);
        var parent2 = curParent(post2);
        if (!parent1 || !parent2)
            return false;
        return parent1 == parent2;
    }

    M.detachPost = function(post) {
        var childset = {};
        childset[post.id] = post;
        this.detachChildren(post, childset);
    }

    // TODO: Rename detachChildren
    var maxiter = 50;
    M.detachChildren = function(post, childset, n) {
        var parent = this.currentParent(post);

        if (!parent || this.isInNorder(parent) || this.isIndented(parent))
            return;

        this.clearSubthread(parent);

        n = n || 0;

        var size = 0;

        var lastpost = parent;
        var start = post;
        while (size < PAGE_SIZE && n < maxiter) {
            if (!childset[post.id] && this.isInNorder(post)) {
                size++;
                this.indent(post);
                this.relocateAfter(post, lastpost);
                lastpost = post;
            }
            post = this.nextsib(post, parent.id);
            if (post == start)
                break;
            n++;
        }

        var gramps = this.prevpost(parent);
        if (n >= maxiter || (!gramps && size == 0)) {
            this.clearSupthread(parent);
            this.clearSubthread(parent, null, true);
        } else if (size == 0) {
            this.detachChildren(parent, childset, n);
        }
    }

    M.attachToParent = function(post, parent) {
        console.assert(this.isChildOf(post, parent), "must attach to actual parent");
        console.log("** attach ", post.id, "to", parent.id);

        var handler = function() { console.warn("no matching case") };

        if (this.isInNorder(post) || this.isInNorder(parent)) {
            console.log("** case: handleInNorder");
            handler = handleInNorder;
        } else if (this.isSiblings(post, parent)) {
            console.log("** case: handleSiblings");
            handler = handleSiblings;
        } else if (this.isAncestor(post, parent)) {
            console.log("** case: handleAncestor");
            handler = handleAncestor;
        } else if (this.isDescendant(post, parent)) {
            // I haven't found a case where this would happen.
            // And I don't think it will since a post
            // cannot be older and younger than a post
            // at the same time.
            //handler = handleDescendant;
            throw "I stand corrected.";
        } else {
            console.log("** case: handleGeneralCase");
            handler = handleGeneralCase;
        }

        handler.call(this, post, parent);

        parent.inNorder = false;
        post.inNorder = false;
        this.hook("attachToParent", post, parent);
        this.history.push([post.id, parent.id]);
    }

    M.attachChild = function(parent, post) {
        if (this.nextpost(parent) == post) {
            if (this.isUndented(post)) {
                this.clearSubthread(parent);
                this.attachSiblings(parent, post);
            }
        } else {
            this.attachToParent(post, parent);
        }
    }

    function handleInNorder(post, parent) {
        if (!this.isInNorder(parent)) {
            this.clearSubthread(parent);
            if (this.isIndented(parent)) {
                var gramps = this.currentParent(parent);
                this.clearSupthread(parent, gramps);
                this.undent(parent);
                this.relocateAfter(parent, gramps);
            }
        }

        if (!this.isInNorder(post)) {
            if (this.isUndented(post)) {
                this.clearSupthread(post);
                this.attachSubthread(parent, post);
            } else {
                this.detachPost(post);
                this.attachSiblings(parent, post);
            }
        } else {
            this.attachSiblings(parent, post);
        }
    }

    function handleSiblings(post, parent) {
        console.log("*** attachToParent[isSiblings]");
        var oldParent = this.currentParent(post);
        this.clearSubthread(oldParent)
        this.relocateAfter(parent, oldParent);
        this.undent(parent);
        this.attachSiblings(parent, post);
    }

    function handleAncestor(post, parent) {
        this.clearSupthread(post, parent);
        if (this.isIndented(post)) {
            this.clearSubthread(post);
            this.attachSiblings(parent, post);
        } else {
            this.attachSubthread(parent, post);
        }
    }

    function handleDescendant(post, parent) {
        console.log("*** attachToParent[isDescendant]");
        if (isIndented(parent))
            undentChild(currentParent(parent), parent);
        this.clearSupthread(post);
        this.clearSubthread(parent)
        this.attachSiblings(parent, post);
    }

    function handleGeneralCase(post, parent) {
        this.undent(parent);
        this.clearSubthread(parent);
        if (this.isUndented(post)) {
            this.attachSubthread(parent, post);
        } else {
            this.detachPost(post);
            this.attachSiblings(parent, post);
        }
    }

    M.visitParent = function(postlink) {
        console.log("**visiting parent", postlink)
        var parent = postlink.targetPost;
        var post = postlink.sourcePost;
        this.attachToParent(post, parent);
    }

    M.visitChild = function(postlink) {
        console.log("**visiting child", postlink);
        var child = postlink.targetPost;
        var post = postlink.sourcePost;
        this.attachChild(post, child);
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
        console.log("**restoring norder", post.id);
        this.hook("restoreNorder", post);
        this.clearNextPost(post);
        this.clearPrevPost(post);
        this.undent(post);
        post.inNorder = true;
    }

    M.clearSubthread = function(post, downto, inclusive) {
        if (!inclusive)
            post = this.nextpost(post);
        // restore subthreads to normal order
        while(post && post != downto) {
            var next = this.nextpost(post);
            this.restoreNorder(post);
            post = next;
        }
    }

    M.clearSupthread = function(post, upto) {
        console.assert(post);
        post = this.prevpost(post);
        while(post && post != upto) {
            var prev = this.prevpost(post);
            this.restoreNorder(post);
            post = prev;
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

    M.getSupthread = function(post) {
        var supt = [];
        while (post) {
            supt.push(post);
            post = this.prevpost(post);
        }
        return supt;
    }

    M.getSubthreadIds = function(post) {
        return this.getSubthread(post)
            .map(function(post) { return post.id });
    }

    M.getSupthreadIds = function(post) {
        return this.getSupthread(post)
            .map(function(post) { return post.id });
    }

    M.restoreSupthread = function(post) {
        var nextpost = post;
        var prev;
        post = post.prevpost();
        while(post && this.isIndented(post)) {
            prev = post.prevpost();
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

    M.clearNextPost = function(post) {
        post.nextpostId = null;
    }

    M.clearPrevPost = function(post) {
        post.prevpostId = null;
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
    M.isUndented = function(post) /*bool*/ {
        return !this.isIndented(post);
    }

    M.isSubthreadRoot = function(post) /*bool*/ {
        return !this.isInNorder(post) && !this.prevpost(post);
    }

    M.isChildOf = function(post, parent) /*bool*/ {
        return post.parentIds.indexOf(parent.id) >= 0;
    }

    M.isRoot = function(post) /*bool*/ {
        return post == this.postdb.op;
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
        this.op = null;
    }
    PostDB.prototype.get = function(id) {
        return this._db[id];
    }
    PostDB.prototype.set = function(id, post) {
        this._db[id] = post;
        if (!this.op)
            this.op = post;
    }
    PostDB.prototype.getPostsByNorder = function() {
        var posts =  [];
        var post = this.op;
        var i = 0;
        while (post && i < 50) {
            posts.push(post);
            post = this.mod.nextnorder(post);
            i++;
        }
        return posts.map(function(p) { return p.id });
    }
    PostDB.prototype.inNorderPosts = function() {
        var intf = this.mod;
        var posts = [];
        for (var k in this._db) {
            var post = this._db[k];
            if (!intf.isInNorder(post))
                continue;
            posts.push(post);
        }
        return posts;
    }
    PostDB.prototype.print = function(id, post) {
        var posts = [];
        for (var k in this._db)
            posts.push(this._db[k]);
        posts.sort(function(p1, p2) {
            return parseInt(p1.id) > parseInt(p2.id);
        });

        var intf = this.mod;
        var n = 0;
        for (var i in posts) {
            var post = posts[i];
            if (intf.isInNorder(post)) {
                printPost("-", post);
                n += 1;
            } else if (intf.isSubthreadRoot(post)) {
                printPost("|", post);
                var subt = intf.getSubthread(post);
                subt.slice(1).forEach(function(post) {
                    printPost("|", post);
                });
                n += subt.length;
            }
        }
        console.log("posts rendered: ", n);
        console.assert(n === mapLength(this._db), "rendered all posts");

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
        function mapLength(m) {
            var n = 0;
            for (var _ in m)
                n++;
            return n;
        }
    }

    // TODO::
    // - make post argument order consistent
    // - avoid destroying subthreads if possible
    // - highlight target of childlink
    // - norder restoration is broke

})(this)



