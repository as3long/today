var fs = require('fs');
var options=require('../model/options');
var Tags=require('../model/tags');
var Category=require('../model/category');
var Media=require('../model/media');
var Utils=require("../common/utils");
module.exports = Ham.Controller({
    init: function (req, res) {
        this.callSuper(req, res);
        this.assign('title', "后台");
        this.assign("noNavBar", false);
        this.assign("navActive", this.req.action);
        if (this.req.action != 'login' && this.req.action != 'regist' && isEmpty(this.session.user)) {
            this.redirect("/admin/login");
        }
    },
    indexAction: function () {
        this.assign('title', "后台");
        this.display();
    },
    /**
     * [[登录]]
     * @returns {[[Type]]} [[Description]]
     */
    loginAction: function () {
        var self = this;
        this.assign("noNavBar", true);
        this.assign('title', "帐号登录");
        self.assign({
            pwd_info: ""
        });
        var check = function () {
            return Ham.model.table("users").where({
                mail: self.sqlValidPost("email"),
                password: md5(self.sqlValidPost("password"))
            }).find();
        };
        if (self.isGet) {
            self.display();
        } else {
            check().then(function (data) {
                //self.assign({pwd_info:JSON.stringify(data)});
                if (data && data.length != 0) {
                    Ham.model.table("users").where({
                        uid: data[0].uid
                    }).update({
                        logged: getNow()
                    }).then(function () {
                        self.session.user = data[0];
                        self.redirect("/admin/index");
                    });
                } else {
                    self.assign({
                        pwd_info: "帐号或密码错误"
                    });
                    self.display();
                }
            }, function (err) {
                self.assign({
                    pwd_info: JSON.stringify(err)
                });
                self.display();
            });
        }
    },
    logoutAction: function () {
        var self = this;
        Ham.model.table("users").where({
            uid: self.session.user.uid
        }).update({
            activated: getNow()
        }).then(function () {
            self.session.user=null;
            self.redirect("/admin/login");
        });
    },
    /**
     * [[注册]]
     * @returns {[[Type]]} [[Description]]
     */
    registAction: function () {
        this.assign("noNavBar", true);
        var self = this;
        var checkEmail = function () {
            var deferred = getDefer();
            Ham.model.table("users").where({
                mail: self.sqlValidPost("email")
            }).find().then(function (data) {
                if (data && data.length > 0) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };
        var addUser = function () {
            var item = {
                mail: self.sqlValidPost("email"),
                name: self.sqlValidPost("email"),
                password: md5(self.sqlValidPost("password")),
                created: parseInt(Date.now() / 1000),
                group: "用户组"
            }
            Ham.model.table('users').add(item)
        };
        if (self.isGet) {
            self.assign({
                pwd_info: ""
            });
            self.display();
        } else {
            if (self.sqlValidPost("password") != self.sqlValidPost("again_password")) {
                self.assign("pwd_info", "密码不一致");
                self.display();
            } else {
                checkEmail().then(addUser, function () {
                    self.assign({
                        pwd_info: "用户名已存在"
                    });
                    self.display();
                }).then(function (data) {
                    self.assign({
                        pwd_info: "注册成功"
                    });
                    self.display();
                }, function (err) {
                    self.assign({
                        pwd_info: "注册失败"
                    });
                    self.display();
                });
            }
        }
    },
    /**
     * [个人设置]
     */
    profileAction: function () {
         this.redirect("/admin/user/"+this.session.user.uid);
    },
    write_postAction: function (id) {
        var self = this;
        var modelPromises=[];
        if (self.isGet) {
            self.assign('title', "撰写新文章");
            self.assign('post',{});
            modelPromises.push(Ham.model.table("metas").where("type","category").select().then(function(categorys){
                self.assign('categorys',categorys);
            }));
            if(id){
                modelPromises.push(Ham.model.table("contents").where("cid",id).find().then(function(posts){
                    self.assign('post',posts[0]);
                }));
                modelPromises.push(Ham.model.table("relationships").join("metas","mid","mid").where("cid",id).select().then(function(metas){
                    var post_categorys=[],
                    post_tags=[];
                    metas.forEach(function(meta){
                        if(meta.type=="category"){
                            post_categorys.push(meta);
                        }else if(meta.type=="tag"){
                            post_tags.push(String(meta.name));
                        }
                    });
                    self.assign("post_categorys",post_categorys);
                    self.assign("tags",post_tags.join(","));
               }));
            }else{
                self.assign("post_categorys",[]);
                self.assign("tags","");
            }
            Promise.all(modelPromises).then(function(){
                self.display();
            });
        } else {
           var obj = {
                title: self.post("title"),
                modified: getNow(),
                text: self.post('text'),
                slug:Utils.pinyin(self.post("title")),
                status: self.post("status")
            }
            var addOrUpdate;
            var findLast;
            var content,tagList,categoryList;
            if(self.post("cid")){
               addOrUpdate=Ham.model.table('contents').where("cid", self.post("cid")).update(obj).then(function(){
                   return Ham.model.table("contents").where("cid",self.post("cid")).find();
               });
            }else{
                obj.created=getNow();
                obj.authorId=self.session.user.uid;
                obj.type="post";
                addOrUpdate=Ham.model.table('contents').add(obj).then(function(){
                    return Ham.model.table("contents").order(["cid","Z"]).find();
                });
            }
            if(self.post("tags")){
                var tags=self.post("tags").split(",");
                modelPromises.push(Tags.addTags(tags).then(function(data){
                    tagList=data;
                }));
            }
            if(self.post("categorys[]")){
                categoryList=self.post("categorys[]").split(",");
            }
            
            modelPromises.push(addOrUpdate.then(function(data){
                content=data[0];
                if(self.post("uploadFiles[]")){
                    var uploadFiles=self.post("uploadFiles[]").split(",");
                    console.log(uploadFiles);
                    return Media.updateParentAll(content.cid,uploadFiles);
                }
            }));
            
            Promise.all(modelPromises).then(function(){
                if(self.post("cid")){
                    return Tags.deleteWhereCid(content.cid);
                }
            }).then(function(){
                var cid=content.cid;
                var relationships=[];
                tagList=tagList||[];
                categoryList=categoryList||[];
                tagList.forEach(function(tag){
                     relationships.push({cid:cid,mid:tag.mid});
                });
                categoryList.forEach(function(category){
                     relationships.push({cid:cid,mid:category});
                });
                if(relationships.length>0){
                    return Ham.model.table("relationships").addAll(relationships);
                }
            }).then(function(){
               self.echo("文章添加成功！"); 
            });
        }
    },
    write_pageAction: function (id) {
        var self = this;
        if (self.isGet) {
            if (id != undefined) {
                var whereObj = {};
                if (isNumberString(id)) {
                    whereObj.cid = parseInt(id);
                } else {
                    whereObj.slug = id;
                }
                Ham.model.table('contents').where(whereObj).find().then(function (data) {
                    self.assign('title', "修改页面");
                    self.assign('content', data[0]);
                    self.display();
                });
            } else {
                self.assign('title', "创建新页面");
                self.assign('content', {});
                self.display();
            }
        } else {
            var obj = {
                title: self.post("title"),
                slug: self.post('slug'),
                created: getNow(),
                modified: getNow(),
                text: self.post('text'),
                authorId: self.session.user.uid,
                type: "page",
                status: self.post("do")
            }
            if (self.post("cid")) {
                Ham.model.table('contents').where("cid", self.post("cid")).update(obj).then(function () {
                    self.redirect("/admin/write_page/" + self.post("cid"));
                });
            } else {
                Ham.model.table('contents').add(obj).then(function () {
                    self.redirect("/admin/write_page");
                });
            }
        }
    },
    delete_pageAction: function (id,postFleg) {
        var self = this;
        id = id || this.post("cid");
        if (id != undefined) {
            Ham.model.table('contents').where("cid", id).delete().then(function () {
                 if(postFleg=="post"){
                    self.redirect("/admin/manage_posts");
                }else{
                    self.redirect("/admin/manage_pages");
                }
            });
        } else {
            if(postFleg=="post"){
                self.redirect("/admin/manage_posts");
            }else{
                self.redirect("/admin/manage_pages");
            }
        }
    },
    manage_postsAction: function () {
        var self = this;
        Ham.model.table('contents').where("type","post").join("users", "uid", "authorId").order(["cid","Z"]).select().then(function (data) {
            data.forEach(function(item){
                item.created=getDate(item.modified);
            });
            self.assign('contents', data);
            self.assign('title', "管理文章");
            self.display();
        });
    },
    manage_pagesAction: function () {
        var self = this;
        Ham.model.table('contents').where("type","page").join("users", "uid", "authorId").select().then(function (data) {
            self.assign('contents', data);
            self.assign('title', "管理独立页面");
            self.display();
        });
    },
    /**
     * [分类管理]
     */
    manage_categoriesAction:function(){
        var self=this;
        Ham.model.table("metas").where("type","category").select().then(function(data){
            self.assign("categories",data);
            self.assign('title', "分类管理");
            self.display();
        });
    },
    /**
     * [用户管理]
     */
    manage_usersAction:function(){
        var self=this;
        Ham.model.table("users").select().then(function(data){
            self.assign("group",self.session.user.group);
            self.assign("users",data);
            self.assign('title', "用户管理");
            self.display();
        });  
    },
    /**
     * [标签管理]
     */
    manage_tagsAction:function(){
        var self=this;
        Ham.model.table("metas").where("type","tag").select().then(function(data){
            self.assign("tags",data);
            self.assign('title', "标签管理");
            self.display();
        });
    },
    /**
     * [文件管理]
     */
    manage_mediasAction:function(){
        var self=this;
        Ham.model.table("media").select().then(function(data){
            self.assign("medias",data);
            self.assign('title', "文件管理");
            self.display();
        });
    },
    /**
     * [基本设置]
     */
    options_generalAction: function () {
        var self = this;
        if (self.isGet) {
            Ham.model.table("options").select().then(function (data) {
                if (data.length == 0) {
                    options.init(self.session.user.uid).then(function () {
                        self.assign("options", {
                            title: "",
                            description: "",
                            keywords: ""
                        });
                        self.assign('title', "基本设置");
                        self.display();
                    });
                } else {
                    var options = {};
                    data.forEach(function (item) {
                        options[item.name] = item.value;
                    });
                    self.assign("options", options);
                    self.assign('title', "基本设置");
                    self.display();
                }
            });
        } else {
            options.update({
                "title": self.post("title"),
                "description": self.post("description"),
                "keywords": self.post("keywords")
             }).then(function () {
                self.redirect("/admin/options_general");
            });
        }
    },
    /**
     * [阅读设置]
     */
    options_readingAction: function () {
        var self = this;
        if (self.isGet) {
            Ham.model.table("options").select().then(function (data) {
                if (data.length == 0) {
                    options.init(self.session.user.uid).then(function () {
                        self.assign("options", {
                            postsListSize: "10",
                            pageSize: "5",
                            feedFullText: "1"
                        });
                        self.assign('title', "阅读设置");
                        self.display();
                    });
                }else {
                    var options = {};
                    data.forEach(function (item) {
                        options[item.name] = item.value;
                    });
                    self.assign("options", options);
                    self.assign('title', "阅读设置");
                    self.display();
                }
            });
        } else {
             options.update({
                "postsListSize": self.post("postsListSize"),
                "postsListSize": self.post("pageSize"),
                "feedFullText": self.post("feedFullText")
             }).then(function () {
                self.redirect("/admin/options_reading");
            });
        }
    },
    uploadAction: function () {
        var self = this;
        if (this.isPost){
            var file = self.files("xfile");
            var tmp_path = file.path;
            var saveObj = getSaveObject(tmp_path);
            var target_path = saveObj.saveUrl;
            fs.rename(tmp_path, target_path, function () {
                var obj = {
                    "url": saveObj.url,
                    "fileName": saveObj.fileName,
                    "name": self.sqlValidString(file.name),
                    "created": getNow(),
                    "type":file.type,
                    "uid": self.session.user.uid
                };
                Ham.model.table('media').add(obj).then(function () {
                    self.echo({
                        "path": saveObj.path,
                        "url": saveObj.url,
                        "filename": saveObj.fileName
                    });
                });
            });
        } else {
            this.redirect("/admin/index");
        }
    },
    /**
     * [分类 添加 修改]
     * @param {[String]} id [mid或者slug]
     */
    categoryAction:function(id){
        var self=this;
        if (self.isGet) {
            if (id != undefined) {
                var whereObj = {type:"category"};
                if (isNumberString(id)) {
                    whereObj.mid = parseInt(id);
                } else {
                    whereObj.slug = id;
                }
                Ham.model.table('metas').where(whereObj).find().then(function (data) {
                    self.assign('title', "修改分类");
                    self.assign('category', data[0]);
                    self.display();
                });
            } else {
                self.assign('title', "新增分类");
                self.assign('category', {});
                self.display();
            }
        }else{
            var obj = {
                name: self.post("name"),
                slug: self.post('slug'),
                description:self.post("description"),
                type:"category",
                count:0
            }
            if (self.post("mid")) {
                if(self.post("del")){
                     Ham.model.table('metas').where("mid",self.post("mid")).delete().then(function(){
                        self.redirect("/admin/manage_categories");
                     });
                }else{
                    Ham.model.table('metas').where("mid", self.post("mid")).update(obj).then(function () {
                        self.redirect("/admin/category/" + self.post("mid"));
                    });
                }
            } else {
                Ham.model.table('metas').add(obj).then(function () {
                    self.redirect("/admin/manage_categories");
                });
            }
        }
    },
    /**
     * [标签 添加 修改]
     * @param {[String]} id [mid或者slug]
     */
    tagAction:function(id){
        var self=this;
        if (self.isGet) {
            if (id != undefined) {
                var whereObj = {type:"tag"};
                if (isNumberString(id)) {
                    whereObj.mid = parseInt(id);
                } else {
                    whereObj.slug = id;
                }
                Ham.model.table('metas').where(whereObj).find().then(function (data) {
                    self.assign('title', "修改标签");
                    self.assign('tag', data[0]);
                    self.display();
                });
            } else {
                self.assign('title', "新增标签");
                self.assign('tag', {});
                self.display();
            }
        }else{
            var obj = {
                name: self.post("name"),
                slug: self.post('slug'),
                type:"tag",
                count:0
            }
            if (self.post("mid")) {
                if(self.post("del")){
                     Ham.model.table('metas').where("mid",self.post("mid")).delete().then(function(){
                        self.redirect("/admin/manage_tags");
                     });
                }else{
                    Ham.model.table('metas').where("mid", self.post("mid")).update(obj).then(function () {
                        self.redirect("/admin/tag/" + self.post("mid"));
                    });
                }
            } else {
                Ham.model.table('metas').add(obj).then(function () {
                    self.redirect("/admin/manage_tags");
                });
            }
        }
    },
    mediaAction:function(id){
        var self=this;
        if (self.isGet) {
            if (id != undefined) {
                var whereObj = {};
                whereObj.mid = parseInt(id);
                Ham.model.table('media').where(whereObj).find().then(function (data) {
                    self.assign('title', "修改文件");
                    self.assign('file', data[0]);
                    self.display();
                });
            } else {
                self.redirect("/admin/manage_medias");
            }
        }else{
            var obj = {
                name: self.post("name"),
                info: self.post('info')
            }
            if (self.post("mid")) {
                if(self.post("del")){
                     Ham.model.table('media').where("mid",self.post("mid")).delete().then(function(){
                        self.redirect("/admin/manage_medias");
                     });
                }else{
                    Ham.model.table('media').where("mid", self.post("mid")).update(obj).then(function () {
                        self.redirect("/admin/media/" + self.post("mid"));
                    });
                }
            }else{
                self.redirect("/admin/manage_medias");
            }
        }
    },
    userAction:function(id){
        var self=this;
        if(self.isGet){
            if (id != undefined) {
                var whereObj = {};
                whereObj.uid = parseInt(id);
                Ham.model.table('users').where(whereObj).find().then(function (data) {
                    self.assign('title', "编辑用户信息");
                    self.assign('user', data[0]);
                    self.display();
                });
            } else {
                self.redirect("/admin/manage_users");
            }
        }else{
            var obj = {
                mail: self.post('mail'),
                screenName:self.post("screenName"),
                url:self.post("url"),
                group:"admin"
            }
            if (self.post("uid")) {
                id=parseInt(self.post("uid"));
                if(self.post("del")){
                     Ham.model.table('users').where("uid", id).delete().then(function(){
                        self.redirect("/admin/manage_users");
                     });
                }else{
                    Ham.model.table('users').where("uid", id).update(obj).then(function () {
                        self.redirect("/admin/user/" + id);
                    });
                }
            }else{
                self.redirect("/admin/manage_users");
            }
        }
    },
    user_passwordAction:function(){
        var self=this;
        if(self.isPost){
            var pwd=self.post("password");
            if(pwd&&pwd==self.post("password2")&&pwd.length>=6){
                var id=parseInt(self.post("uid"));
                Ham.model.table('users').where('uid',id).update({password:md5(pwd)}).then(function(){
                    self.echo({status:"true",msg:""});
                });
            }else{
                self.echo({status:"false",msg:"密码更新失败"});
            }
        }else{
            self.redirect("/admin/manage_users");
        }
    }
});