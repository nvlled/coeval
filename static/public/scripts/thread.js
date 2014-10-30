"use strict";

var intfcore;
var intfmain;

var cm = {
    INDENTED: "indented",
    SUBTHREAD: "subthread",
    POST_ID: "post-id",
    POST_BODY: "post-body",
    POST_REPLIES: "post-replies",
    POST_LINK: "postlink",
    POST_VOIDLINK: "void",
    POST_ANCHOR: "post-anchor",
    HIGHLIGHT: "highlight",
    POST: "post",

}

this.addEventListener("load", init);

function init() {
    intfmain.setClassMap(cm);
    intfcore = intf.newModule({
        hooks: intfmain.createHooks(),
    });

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
            intfmain.addLinkNodeAttrs(parent, linkNode, "parent");
            linkNode.onclick = intfcore.createLinkHandler(postlink);
        } else {
            linkNode.classList.add(cm.POST_VOIDLINK);
            linkNode.href = "#";
            linkNode.onclick = function() { return false };
        }
    }
}

function linkToParentNodes(post) {
    post.parentIds.forEach(function(parentId) {
        var parentNode = document.getElementById("p"+parentId);
        var postlink = intfcore.childlink(post.id, parentId);
        if (parentNode) {
            var linkNode = intfmain.createPostLinkNode(post, intfcore.CHILD_LINK);
            linkNode.onclick = intfcore.createLinkHandler(postlink);

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
