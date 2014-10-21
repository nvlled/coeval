"use strict";

(function(root) {

    // exports
    root.intfmain = {
        buildThread: buildThread,
        init: function() {
            postPreview = new PostPreview();
            initPostTempl();
        },
    }

    var postPreview;
    var postdb = {};

    function getPost(id) { return postdb[id] }
    root.getPost = getPost;

    intf = intf.newModule({
        newNode: newPostNode,
        getPost: getPost,
        hooks: createHooks(),
    });

    function buildThread(posts, container) {
        if (!container)
            container = document.body;

        posts.forEach(function(postData) {
            var post = intf.newPost(postData);
            post.node = newPostNode(postData);

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

        parsePostBody(data, bodyNode);

        return postNode;
    }

    function createPostLinkNode(id, type, handler) {
        var a = document.createElement("a");
        a.href = '#p'+id;
        a.classList.add("postlink");
        a.classList.add(""+type);
        a.textContent = ">>"+id;
        a.onclick = handler;
        a.onmouseover = postPreview.newMouseoverHandler(id);
        a.onmouseout  = postPreview.newMouseoutHandler(id);

        return a;
    }

    var PlinkType = {
        PARENT: "parent",
        CHILD: "child",
    }

    function br() {
        return document.createElement("br");
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

    function parsePostBody(postData, node) {
        var lines = postData.body.split("\n");
        lines.forEach(function(line) {
            if (line[0] == '>' && line[1] != '>') {
                node.appendChild(maymayArrow(line.substr(0)));
                node.appendChild(br());
                // Fix: don't return, just add styling on the current line
                return;
            }
            var matched = false;
            var pat = /(>>\d+)/g;
            var lastIndex = 0;
            while(true) {
                var m = pat.exec(line);
                if (m == null)
                    break;
                matched = true;
                var parentId = m[1].substr(2);
                var postlinkNode = createPostLinkNode(parentId, PlinkType.PARENT);

                var postlink = intf.parentlink(parentId, postData.id);
                postlinkNode.onclick = intf.createLinkHandler(postlink);

                var pretext = line.slice(lastIndex, pat.lastIndex - m[1].length);
                node.appendChild(textNode(pretext));
                node.appendChild(postlinkNode);
                lastIndex = pat.lastIndex;
            }
            var pretext = line.slice(lastIndex);
            node.appendChild(textNode(pretext));

            node.appendChild(br());
        });
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

    function createHooks() {
        return {
            visitLink: function(postlink) {
                var post = postlink.targetPost;
                if (postlink.type == "parent") {
                    post.node.scrollIntoView();
                }
                postPreview.hide();
            },

            attachToParent: function(post, parent) {
                parent.node.classList.add("subthread");
            },

            undent: function(post) {
                post.node.classList.remove("indented");
            },

            indent: function(post) {
                post.node.classList.add("indented");
            },

            relocateAfter: function(post, dest) {
                insertAfter(post.node, dest.node);
                post.node.classList.add("subthread");
            },

            restoreNorder: function(post) {
                // Root posts (or OP) should
                // always be placed first.
                if (this.isRoot(post)) {
                    var container = post.node.parentNode;
                    var firstNode = container.children[0];
                    insertBefore(post.node, firstNode);
                    return;
                }

                var next = this.nextnorder(post);
                var prev = this.prevnorder(post);
                while(true) {
                    if (prev) {
                        console.log("prev:", prev.id);
                        if (this.isInNorder(prev)) {
                            insertAfter(post.node, prev.node);
                            break;
                        }
                        prev = this.prevnorder(prev);
                    } else if (next) {
                        console.log("next:", next.id);
                        if (this.isInNorder(next)) {
                            insertBefore(post.node, next.node);
                            break;
                        }
                        next = this.nextnorder(next);
                    } else {
                        var node = post.node;
                        appendChild(node.parentNode, node);
                        break;
                    }
                }
                post.node.classList.remove("subthread");
            },
        }
    }

    function screenTop()    { return window.scrollY; }
    function screenBottom() { return screenTop() + window.screen.height }

    function withinScreen(node) {
        var x = 30; // I called it x because I just don't know
        var nodeTop = node.offsetTop;
        var nodeBot = nodeTop + node.clientHeight + x;

        var scrTop = screenTop();
        var scrBot = screenBottom();

        return nodeTop > scrTop && nodeBot < scrBot;
    }

    function PostPreview() {
        this.node   = null;
        this.highId = null;
    }

    PostPreview.prototype = {

        hide: function() {
            if (this.node) {
                this.node.remove();
            }
            var post = intf.getPost(this.highId);
            this.removeHighlight(post);
        },

        addHighlight: function(post) {
            post.node.classList.add("highlight");
            this.highId = post.id;
        },

        removeHighlight: function(post) {
            if (post)
                post.node.classList.remove("highlight");
            this.highId = null;
        },

        newMouseoverHandler: function(postId) {
            return function(e) {
                if (this.node)
                    this.node.remove();

                var post = intf.getPost(postId);
                if (withinScreen(post.node)) {
                    this.addHighlight(post);
                    return;
                }

                this.node = post.node.cloneNode(true);
                this.node.style.position = "absolute";

                var top = window.scrollY+e.clientY;
                var bottom = top + post.node.clientHeight;
                if (bottom >= screenBottom()*.90) {
                    top -= post.node.clientHeight;
                }
                this.node.style.top = top+"px";
                this.node.style.left = e.clientX+"px";
                this.node.style.width = "80%";

                document.body.appendChild(this.node);

            }.bind(this);
        },

        newMouseoutHandler: function(postId) {
            return function(e) {
                var post = intf.getPost(postId);
                post.node.classList.remove("highlight");

                if (!this.node)
                    return;

                this.node.style.position = "relative";
                this.node.style.top = "0px";
                this.node.style.left = "0px";
                this.node.remove();
                this.node = null;
            }.bind(this);
        }
    }

})(this);




