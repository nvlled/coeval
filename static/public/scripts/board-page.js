

window.addEventListener("load", function() {
    var form = document.querySelector("form");
    console.log(form);
    util.asynchronizeForm(form, {
        successMsg: "Thread created",
        handler: function(response) {
            var data = JSON.parse(response);
            console.log(data);
            setTimeout(function() {
                window.location = data.url;
            }, 2000);
        }
    });
});
