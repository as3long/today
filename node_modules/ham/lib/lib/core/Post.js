var Class = require("./../../Class");
var formidable = require('formidable');
var xss = require('xss');
module.exports = Class.extend({
    req: null,
    res: null,
    postRow: null,
    run: function (req, res) {
        var deferred = getDefer();
        this.req = req;
        this.res = res;
        if (this.checkPost()) {
            var form = new formidable.IncomingForm();
            form.encoding = 'utf-8';
            form.uploadDir = APP_PATH+"/ham/temp";
            form.maxFieldsSize = 5 * 1024 * 1024;
            form.keepExtensions = true;
            form.parse(req, function (err, fields, files) {
                if (err) {
                    deferred.reject(err);
                } else {
                    for (var key in fields) {
                        fields[key] = xss(String(fields[key]));
                    }
                    req.postFields = fields;
                    req.postFiles = files;
                    deferred.resolve();
                }
            });
        } else {
            deferred.resolve();
        }
        return deferred.promise;
    },
    checkPost: function () {
        return this.req.method.toLowerCase() == "post";
    }
}).create();