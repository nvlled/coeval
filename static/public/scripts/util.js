"use strict";

(function(root) {

    var M = {};

    M.fetch = function(url, fn) {
        var req = new XMLHttpRequest();
        req.open("GET", url);
        req.onload = function(data) {
            fn(data);
        }
        req.send();
    }

    root.util = M;

})(this);
