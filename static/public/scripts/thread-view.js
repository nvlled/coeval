
this.addEventListener("load", load);

var postTempl;

function load() {
    // Note: order is important
    initPostTempl();
    thread.init();

    var form = document.querySelector("form");
    var threadContainer = document.querySelector("#thread-container");
    util.asynchronizeForm(form, {
        handler : function(responseText) {
            var postData = JSON.parse(responseText);
            var node = newPostNode(postData);
            console.log(postData, node);
            thread.addPost(node);
            threadContainer.appendChild(node);
        }
    });
}

function newPostNode(post) {
    var node = postTempl.cloneNode(true);
    node.id = "p"+post.id;
    node.querySelector(".post-id").textContent = post.id;
    node.querySelector(".post-title").textContent = post.title;
    node.querySelector(".post-user").textContent = post.creator;
    node.querySelector(".post-body").innerHTML = post.body;
    return node;
}

function initPostTempl() {
    postTempl = document.querySelector("#template .post");
    postTempl.remove();
}
