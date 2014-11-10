"use strict";

(function(root) {

    var M = {};

    var reduce = Array.prototype.reduceRight;

    M.fetch = function(url, fn) {
        var req = new XMLHttpRequest();
        req.open("GET", url);
        req.onload = function(data) {
            fn(data);
        }
        req.send();
    }

    M.formValues = function(form) {
        var fields = form.querySelectorAll("[name]");
        return reduce.call(fields, function(result, field) {
            if (field.type != "hidden") {
                result[field.name] = field.value;
            }
            return result;
        }, {});
    }

    M.encodeFormData = function(data) {
        var result = "";
        for (var k in data) {
            var key = encodeURIComponent(k);
            var value = encodeURIComponent(data[k]);
            result += key+"="+value+"&";
        }
        return result;
    }

    M.asynchronizeForm = function(form, opts) {
        opts = opts || {};

        var url = new URL(form.action);
        var method = form.method;
        var info = form.querySelector(".info");

        url.pathname = "/api"+url.pathname;

        form.onsubmit = function(e) {
            e.preventDefault();
            clearErrors(form);

            var data = M.formValues(form);
            console.log("submitting form", M.encodeFormData(data));

            if (info) {
                info.textContent = "submitting..."
            }
            var req = new XMLHttpRequest();
            req.open(method, url.toString());
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            req.onload = function() {
                if (req.status / 100 != 2)
                    showError(req);
                else {
                    info.textContent = "Done";
                    form.reset();
                    if (typeof opts.handler === "function")
                        opts.handler(req.responseText);
                }
            }
            req.onerror = function() {
                info.textContent = "submission failed";
            }
            req.send(M.encodeFormData(data));
            return false;
        }

        function clearErrors(form) {
            var errors = form.querySelectorAll(".error");
            for (var i = 0; i < errors.length; i++) {
                errors[i].textContent = "";
            }
        }

        function showError(req) {
            try {
                var resp = JSON.parse(req.responseText);
                var error = resp.error;
                if (error) {
                    console.log("error", error);
                    for (var k in error) {
                        var out = form.querySelector(".error."+k);
                        if (out)
                            out.textContent = ">"+error[k];
                    }
                }
            } catch (e) { }
            info.textContent = "submission failed";
        }
    }

    root.util = M;

})(this);
