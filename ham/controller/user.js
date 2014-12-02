var user = require("../model/user");
module.exports = Ham.Controller({
    init:function(){
        this.assign("title","还没有设置title");
    },
    testAction:function(){
        this.display();
    },
    /**
     * [登录模块]
     */
    loginAction: function () {
        this.assign("title", "Today从这里开始");
        var self = this;
        self.assign("error", false);
        var loginedFunc = function (data) {
            self.session.user = data[0];
            self.redirect("/index/index");
        }
        if (self.isGet) {
            self.display();
        } else {
            var password = self.sqlValidPost("password");
            var name = self.sqlValidPost("name");
            if (password.length < 6) {
                self.assign("error", "password");
                self.display();
                return;
            } else {
                user.checkUser(name, password).then(loginedFunc, function (data) {
                    if(data){
                        self.assign("easyTpl","密码错误！<a href='/user/login'>返回登录</a>");
                        self.display("easyTpl");
                    }else{
                        user.addUser(name, password).then(function () {
                            user.checkUser(name, password).then(loginedFunc);
                        });
                    }
                })
            }
        }
    },
    /**
     * [退出]
     */
    logoutAction: function () {
        var self = this;
        self.session.user = null;
        self.redirect("/user/login");
    },
    settingAction:function(){
        var self=this;
        if (self.session.user==null) {
            self.redirect("/user/login");
        }else{
            self.assign("title","帐号设置");
            if(self.isGet){
                self.assign("user",self.session.user);
                self.display();
            }else{
                var item={
                    realname:self.post("realname"),
                    section:self.post("section")
                }
                if(self.post("password1")&&self.post("password2")){
                    var md5Str=md5(self.post("password1"));
                    if(md5Str==self.session.user.password&&self.post("password2").length>=6){
                        item.password=md5(self.post("password2"));
                    }else{
                        self.assign("easyTpl","修改失败，原密码错误或新密码小于6位<a href='/user/setting'>返回设置</a>");
                        self.display("easyTpl");
                        return;
                    }
                }
                user.updateUser(self.session.user.id,item).then(function(){
                        self.session.user.realname=self.post("realname");
                        self.session.user.section=self.post("section");
                        self.assign("easyTpl","修改成功<a href='/user/setting'>返回首页</a>");
                        self.display("easyTpl");
                });
            }
        }
    }
});