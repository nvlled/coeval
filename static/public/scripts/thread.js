"use strict";

(function(root) {

root.thread = {
    init: init,
}

var intfcore = root.intf;
var intfmain = root.intfmain;

var cm = {
    INDENTED: "indented",
    SUBTHREAD: "subthread",
    POST_ID: "post-id",
    POST_BODY: "post-body",
    POST_REPLIES: "post-replies",
    POST_LINK: "postlink",
    POST_VOIDLINK: "void",
    POST_ANCHOR: "post-anchor",
    POST_LINK_REF: "referred",
    POST_LINK_ACTIVE: "active",
    HIGHLIGHT: "highlight",
    POST: "post",
}

function init(opts) {
    opts = opts || {};
    cm = mergeObject(opts.cm, cm)

    intfmain.setClassMap(cm);
    intfcore = intf.newModule({
        hooks: intfmain.createHooks(),
    });
    root.thread.intfcore = intfcore;
    root.thread.intfmain = intfmain;

    buildThread();
}

function buildThread() {
    var nodes = document.querySelectorAll("."+cm.POST);
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var data = getPostData(node);

        var post = intfcore.newPost(data);
        post.node = node;
        addLinkHandlers(post);
        linkToParentNodes(post);
    }
}

function getPostData(node) {
    return {
        id: node.querySelector("."+cm.POST_ID).textContent,
        body: node.querySelector("."+cm.POST_BODY).textContent,
    }
}

function addLinkHandlers(post) {
    var links = post.node.querySelectorAll("."+cm.POST_LINK);
    for (var i = 0; i < links.length; i++) {
        var linkNode = links[i];
        var parentId = linkNode.textContent.slice(2);
        var postlink = intfcore.parentlink(parentId, post.id);
        var parent = intfcore.getPost(parentId);

        if (parent) {
            intfmain.addLinkNodeAttrs(post, parent, linkNode, "parent");
            linkNode.onclick = intfcore.createLinkHandler(postlink);
        } else {
            linkNode.classList.add(cm.POST_VOIDLINK);
            linkNode.href = "#";
            linkNode.onclick = function() { return false };
        }
    }
}

function keepViewOffset(node, fn) {
    return function() {
        var scroll = window.scrollY;
        var x = node.offsetTop;
        var val = fn.apply(null, arguments);
        var y = node.offsetTop;
        var scroll_ = scroll-(x-y)
        window.scrollTo(0, scroll_);
        return val;
    }
}

function linkToParentNodes(post) {
    post.parentIds.forEach(function(parentId) {
        var parentNode = document.getElementById("p"+parentId);
        var postlink = intfcore.childlink(post.id, parentId);
        if (parentNode) {
            var parent = {id: parentId, node: parentNode}; // or intfcore.getPost
            var linkNode = intfmain.createPostLinkNode(parent, post, intfcore.CHILD_LINK);
            var handler = intfcore.createLinkHandler(postlink);
            linkNode.onclick = keepViewOffset(parentNode, handler);

            var replies = parentNode.querySelector("."+cm.POST_REPLIES);
            var added = replies.added;
            if (!added)
                added = replies.added = [];

            if (added.indexOf(post.id) < 0)
                replies.appendChild(linkNode);
            added.push(post.id);
        }
    });
}

function mergeObject(dest, src) {
    var m = {};
    for (var k in src) {
        if (!src.hasOwnProperty(k))
            continue;
        m[k] = src[k];
    }
    for (var k in dest) {
        if (!dest.hasOwnProperty(k))
            continue;
        if (dest[k])
            m[k] = dest[k];
    }
    return m;
}

})(this);
