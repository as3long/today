module.exports = Ham.Controller({
    init: function () {
        var self=this;
        if (this.session.user == null) {
            this.redirect("/user/login");
        } else {
            this.assign("title", "Today");
            return Ham.model.table("user").select().then(function(data){
                var sjArr=[];
                var cgArr=[];
                var allUser=data;
                data.forEach(function(user){
                    if(user.section==1){
                        sjArr.push(user);
                    }else if(user.section==2){
                        cgArr.push(user);
                    }
                });
                self.assign("allUser",allUser);
                self.assign("sjArr",sjArr);
                self.assign("cgArr",cgArr);
            });
        }
    },
    indexAction: function () {
        var self = this;
        Ham.model.table("task").where("execut_uid", parseInt(self.session.user.id)).order(["id","Z"]).select().then(function (data) {
            self.assign("nowUid",self.session.user.id);
            data.forEach(function (task) {
                task.created = getDate(task.created);
                task.predict = getDate(task.predict);
                task.realtime = task.realtime ? getDate(task.realtime) : "";
            });
            self.assign("taskList", data);
            self.display();
        })
    },
    myPublishAction:function(){
        var self = this;
        Ham.model.table("task").where("publish_uid",parseInt(self.session.user.id)).select().then(function (data) {
            self.assign("nowUid",self.session.user.id);
            data.forEach(function (task) {
                task.created = getDate(task.created);
                task.predict = getDate(task.predict);
                task.realtime = task.realtime ? getDate(task.realtime) : "";
            });
            self.assign("taskList", data);
            self.display();
        })
    },
    userTasksAction:function(id){
        var self = this;
        Ham.model.table("task").where("execut_uid", parseInt(id)).order(["id","Z"]).select().then(function (data) {
            self.assign("nowUid",id);
            data.forEach(function (task) {
                task.created = getDate(task.created);
                task.predict = getDate(task.predict);
                task.realtime = task.realtime ? getDate(task.realtime) : "";
            });
            self.assign("taskList", data);
            self.display();
        })
    },
    /**
     * [编辑模块]
     */
    addTaskAction: function () {
        var self = this;
        if (self.isGet) {
            self.assign("title", "添加任务");
            self.assign("today", getDate(getNow()));
            self.display();
        } else {
            var predict = self.post("predict");
            var item = {
                predict: parseInt((new Date(predict)) / 1000),
                content: self.post("content"),
                publish_uid: self.session.user.id,
                created: getNow(),
                execut_uid: self.post("execut_uid"),
                status: 0
            }
            Ham.model.table("task").add(item).then(function () {
                self.redirect("/index/index");
            });
        }
    },
    updateTaskAction: function (id) {
        var self = this;
        var uid = self.session.user.id;
        if (self.isGet) {
            self.assign("title", "提交任务");
            Ham.model.table("task").where("id", id).find().then(function (data) {
                if (data && data.length > 0) {
                    var task = data[0];
                    if (task.execut_uid == uid || task.publish_uid == uid) {
                        self.assign("task", task);
                        self.display();
                    } else {
                        self.redirect("/index/index");
                    }
                } else {
                    self.redirect("/index/index");
                }
            });
        } else {
            var item={
                 content: self.post("content"),
                 status:self.post("status"),
                 realtime:parseInt((new Date(self.post("realtime"))) / 1000)
            }
            Ham.model.table("task").where("id", id).update(item).then(function(){
                self.redirect("/index/index");
            });
        }
    },
    updateTask2Action: function (id) {
        var self = this;
        var uid = self.session.user.id;
        if (self.isGet) {
            self.assign("title", "修改任务");
            Ham.model.table("task").where("id", id).find().then(function (data) {
                if (data && data.length > 0) {
                    var task = data[0];
                    if (task.execut_uid == uid || task.publish_uid == uid) {
                        task.created=getDate(task.created);
                        task.predict=getDate(task.predict);
                        task.realtime=getDate(task.realtime);
                        self.assign("task", task);
                        self.display();
                    } else {
                        self.redirect("/index/index");
                    }
                } else {
                    self.redirect("/index/index");
                }
            });
        } else {
            if(self.post("delete")){
                Ham.model.table("task").where("id", id).delete().then(function(){
                    self.assign("easyTpl","删除成功<a href='/index/myPublish'>返回我发布的任务</a>");
                    self.display("easyTpl"); 
                });
            }else{
                var item={
                    content: self.post("content"),
                    status:self.post("status"),
                    predict: parseInt((new Date(self.post("predict"))) / 1000),
                    realtime:parseInt((new Date(self.post("realtime"))) / 1000)
                }
                Ham.model.table("task").where("id", id).update(item).then(function(){
                    self.redirect("/index/index");
                });
            }
        }
    },
    calendarAction:function(id){
        var self=this;
        self.assign("nowUid",id||self.session.user.id);
        this.display();
    },
    myCaljsonAction:function(id){
        var self=this;
        Ham.model.table("task").where("execut_uid", parseInt(id)).order(["id","Z"]).select().then(function (data) {
            var showData=[];
            data.forEach(function (task) {
                var obj={};
                obj.id=task.id;
                obj.title=task.content;
                obj.start=getDate(task.created);
                obj.end=getDate(task.predict);
                obj.allDay=true;
                showData.push(obj);
            });
            self.echo(showData);
        });
    }
});