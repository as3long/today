var marked = require("marked");
module.exports = Ham.Controller("base", {
    indexAction: function () {
        this.redirect("/index/blog/");
    },
    blogAction: function (id) {
        var self = this;
        if (id) {
            Ham.model.table("contents").where("cid", id).cache().find().then(function (data) {
                data = data[0];
                data.text = marked(data.text);
                self.assign("content", data);
                self.display();
            });
        } else {
            self.redirect("/index/blog/");
        }
    },
    tagAction: function (id,page) {
        page=page||1;
        var self = this;
        if (id) {
            Promise.all([Ham.model.table("tags_contents").where({
                    __sql: [["`mids` LIKE ? AND `type`=? AND `status`=? AND `metas_type`=?", ["%"+id+"%","post","publish","tag"]]]
                }).page(page, self.options.postsListSize).order(["modified", "Z"]).cache().select().then(function (data) {
                    data.forEach(function (item) {
                        item.text = marked(item.text);
                        item.text = get_summary(item.text, 300);
                    });
                    self.assign("contents", data);
                }), Ham.model.table("contents").where({
                    __sql: [["`mids` LIKE ? AND `type`=? AND `status`=? AND `metas_type`=?", ["%"+id+"%","post","publish","tag"]]]
                }).cache().count('cid').then(function (data) {
                    self.assign("now_page", page);
                    var pageNum = Math.ceil(data / self.options.postsListSize);
                    var pages = [];
                    for (var i = 1; i < pageNum + 1; i++) {
                        pages.push(i);
                    }
                    self.assign("pages", pages);
                })]).then(function () {
                self.display("/index/blog");
            });
        } else {
            self.redirect("/index/blog/");
        }
    },
    categoryAction: function (id,page) {
        page=page||1;
        var self = this;
        if (id) {
            Promise.all([Ham.model.table("tags_contents").where({
                    __sql: [["`mids` LIKE ? AND `type`=? AND `status`=? AND `metas_type`=?", ["%"+id+"%","post","publish","tag"]]]
                }).page(page, self.options.postsListSize).order(["modified", "Z"]).cache().select().then(function (data) {
                    data.forEach(function (item) {
                        item.text = marked(item.text);
                        item.text = get_summary(item.text, 300);
                    });
                    self.assign("contents", data);
                }), Ham.model.table("tags_contents").where({
                    __sql: [["`mids` LIKE ? AND `type`=? AND `status`=? AND `metas_type`=?", ["%"+id+"%","post","publish","tag"]]]
                }).cache().count('cid').then(function (data) {
                    self.assign("now_page", page);
                    var pageNum = Math.ceil(data / self.options.postsListSize);
                    var pages = [];
                    for (var i = 1; i < pageNum + 1; i++) {
                        pages.push(i);
                    }
                    self.assign("pages", pages);
                })]).then(function () {
                self.display("/index/blog");
            });
        } else {
            self.redirect("/index/blog/");
        }
    }
});