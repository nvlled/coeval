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

    function createPostLinkNode(post, type) {
        var a = document.createElement("a");
        return addLinkNodeAttrs(post, a, type);
    }

    function addLinkNodeAttrs(post, node, type) {
        node.href = '#p'+post.id;
        node.classList.add("postlink");
        node.classList.add(""+type);
        node.textContent = ">>"+post.id;
        node.onmouseover = postPreview.newMouseoverHandler(post.node);
        node.onmouseout  = postPreview.newMouseoutHandler(post.node);
        return node;
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
                parent.node.classList.add(classMap.SUBTHREAD);
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
            },
        }
    }

    function PostPreview() {
        this.clonedNode = null;
        this.highlightedNode = null;
        this.node   = null;
        this.highId = null;
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

        addHighlight: function(node) {
            node.classList.add(classMap.HIGHLIGHT);
            this.highlightedNode = node;
        },

        removeHighlight: function() {
            var node = this.highlightedNode;
            if (node)
                node.classList.remove(classMap.HIGHLIGHT);
            this.highlightedNode = null;
        },

        newMouseoverHandler: function(node) {
            return function(e) {
                this.removeClone();

                if (withinScreen(node)) {
                    this.addHighlight(node);
                    return;
                }

                var clone = node.cloneNode(true);
                clone.style.position = "absolute";

                var top = window.scrollY+e.clientY;
                var bottom = top + node.clientHeight;
                if (bottom >= screenBottom()*.90) {
                    top -= node.clientHeight;
                }
                clone.style.top = top+"px";
                clone.style.left = e.clientX+"px";
                clone.style.width = "80%";

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
