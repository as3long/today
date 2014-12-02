var cache = require("./cache");
module.exports.init = function (uid) {
    return Ham.model.table("options").addAll([
        {
            name: "title",
            value: "",
            user: uid
        },
        {
            name: "description",
            value: "",
            user: uid
            },
        {
            name: "keywords",
            value: "",
            user: uid
            },
        {
            name: "pageSize",
            value: "5",
            user: uid
            },
        {
            name: "postsListSize",
            value: "10",
            user: uid
            },
        {
            name: "feedFullText",
            value: "1",
            user: uid
            }
        ]);
}
module.exports.update = function (obj) {
    var arr = [];
    for (var k in obj) {
        arr.push(Ham.model.table("options").where("name", k).update({
            value: obj[k]
        }));
    }
    //cache.set("options", null, 0);
    return Promise.all(arr);
}

module.exports.get = function (name) {
    var deferred = getDefer();
    var options = cache.get("options");
    if (options) {
        cache.set("options", options);
        deferred.resolve(name ? options[name] : options);
    } else {
        Ham.model.table("options").select().then(function (data) {
            options = {};
            data.forEach(function (item) {
                options[item.name] = item.value;
            });
            cache.set("options", options);
            deferred.resolve(name ? options[name] : options);
        });
    }
    return deferred.promise;
}