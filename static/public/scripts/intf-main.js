"use strict";

(function(root) {

    root.intfmain = {
        createPostLinkNode: createPostLinkNode,
        createHooks: createHooks,
        setClassMap: setClassMap,
        addLinkNodeAttrs: addLinkNodeAttrs,
    }

    var postPreview;
    var classMap;

    function init() {
        postPreview = new PostPreview();
    }

    function setClassMap(cm) {
        classMap = cm;
    }

    function createPostLinkNode(sourcePost, post, type) {
        var a = document.createElement("a");
        return addLinkNodeAttrs(sourcePost, post, a, type);
    }

    // TODO: Change arguments to a postlink instead
    function addLinkNodeAttrs(sourcePost, post, node, type) {
        node.href = '#p'+post.id;
        node.classList.add("postlink");
        node.classList.add(""+type);
        node.textContent = ">>"+post.id;
        node.classList.add("pl"+post.id);
        node.onmouseover = postPreview.newMouseoverHandler(type, sourcePost, post);
        node.onmouseout  = postPreview.newMouseoutHandler();
        return node;
    }

    function createHooks() {
        return {
            visitLink: function(postlink) {
                var post = postlink.targetPost;
                var node = post.node;
                postPreview.hide();
                if (postlink.type === "parent") {
                    //var a = node.querySelector("."+classMap.POST_ANCHOR);
                    //a.click();
                    post.node.scrollIntoView();
                }
                postPreview.addHighlight("", node);
            },

            attachToParent: function(post, parent) {
                var node = parent.node;
                var linkNode = node.querySelector(".pl"+post.id);

                deactivatePostlinks(node);
                linkNode.classList.add(classMap.POST_LINK_ACTIVE);
                node.classList.add(classMap.SUBTHREAD);
            },

            undent: function(post) {
                post.node.classList.remove(classMap.INDENTED);
            },

            indent: function(post) {
                post.node.classList.add(classMap.INDENTED);
            },

            relocateAfter: function(post, dest) {
                insertAfter(post.node, dest.node);
                post.node.classList.add(classMap.SUBTHREAD);
            },

            insertBefore: function(post, dest) {
                insertBefore(post.node, dest.node);
            },

            insertAfter: function(post, dest) {
                insertAfter(post.node, dest.node);
            },

            restoreNorder: function(post) {
                // Root posts (or OP) should
                // always be placed first.
                if (this.isRoot(post)) {
                    var container = post.node.parentNode;
                    var firstNode = container.children[0];
                    insertBefore(post.node, firstNode);
                    post.node.classList.remove(classMap.SUBTHREAD);
                    return;
                }

                var next = this.nextnorder(post);
                var prev = this.prevnorder(post);
                while(true) {
                    if (prev) {
                        if (this.isInNorder(prev)) {
                            insertAfter(post.node, prev.node);
                            break;
                        }
                        prev = this.prevnorder(prev);
                    } else if (next) {
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
                post.node.classList.remove(classMap.SUBTHREAD);
                deactivatePostlinks(post.node);
            },
        }
    }

    function PostPreview() {
        this.clonedNode = null;
        this.highlightedNode = null;
        this.node   = null;
        this.sourceId = null;
    }

    PostPreview.prototype = {

        hide: function() {
            this.removeClone();
            this.removeHighlight();
        },

        removeClone: function() {
            if (this.clonedNode) {
                this.clonedNode.remove();
            }
        },

        addHighlight: function(sourceId, node) {
            node.classList.add(classMap.HIGHLIGHT);
            this.showReferredLink(sourceId, node);
            this.highlightedNode = node;
        },

        removeHighlight: function() {
            var node = this.highlightedNode;
            if (node) {
                node.classList.remove(classMap.HIGHLIGHT);
                this.hideReferredLink(this.sourceId, node);
            }
            this.highlightedNode = null;
        },

        showReferredLink: function(sourceId, node) {
            var linkNodes = node.querySelectorAll(".pl"+sourceId);
            for (var i = 0; i < linkNodes.length; i++) {
                linkNodes[i].classList.add(classMap.POST_LINK_REF);
            }
            this.sourceId = sourceId;
        },

        hideReferredLink: function(sourceId, node) {
            var linkNodes = node.querySelectorAll(".pl"+sourceId);
            for (var i = 0; i < linkNodes.length; i++) {
                linkNodes[i].classList.remove(classMap.POST_LINK_REF);
            }
        },

        newMouseoverHandler: function(type, sourcePost, post) {
            return function(e) {
                this.removeHighlight();
                this.removeClone();

                var node = post.node;
                if (withinScreen(node)) {
                    this.addHighlight(sourcePost.id, node);
                    return;
                }

                var clone = node.cloneNode(true);
                this.showReferredLink(sourcePost.id, clone);
                clone.classList.add("preview")
                clone.style.position = "absolute";
                clone.style.width = sourcePost.node.clientWidth+"px";
                clone.style.left = sourcePost.node.offsetLeft+"px";
                clone.classList.remove(classMap.INDENTED);
                clone.classList.remove(classMap.SUBTHREAD);

                var top = window.scrollY+e.clientY;
                var h = node.clientHeight;
                var magic = 30; // TODO: Make less ironic
                if (type === "child")
                    clone.style.top = (top+magic)+"px";
                else {
                    var h = node.clientHeight;
                    clone.style.top = (top-h-magic)+"px";
                }

                document.body.appendChild(clone);
                this.clonedNode = clone;

            }.bind(this);
        },

        newMouseoutHandler: function() {
            return function(e) {
                this.removeHighlight();

                var clone = this.clonedNode;
                if (!clone)
                    return;

                clone.style.position = "relative";
                clone.style.top = "0px";
                clone.style.left = "0px";
                clone.remove();
                this.clonedNode = null;
            }.bind(this);
        }
    }

    function deactivatePostlinks(node) {
        var linkNodes = node.querySelectorAll("."+classMap.POST_LINK_ACTIVE);
        for (var i = 0; i < linkNodes.length; i++) {
            linkNodes[i].classList.remove(classMap.POST_LINK_ACTIVE);
        }
    }


    function screenTop()      { return window.scrollY; }
    function screenBottom()   { return screenTop() + window.innerHeight }

    function withinScreen(node) {
        var h = node.clientHeight;
        var nodeTop = node.offsetTop;
        var nodeMid = node.offsetTop + h/2;
        var nodeBot = nodeTop + h;

        var scrTop = screenTop();
        var scrBot = screenBottom();

        return nodeMid > scrTop && nodeMid < scrBot;
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

    init();

})(this);
