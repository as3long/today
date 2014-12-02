var Contents=module.exports;
var cache=require("./cache");
Contents.latestPosts=function(){
    var deferred = getDefer();
    var latestPosts=cache.get("latestPosts");
    if(latestPosts){
        deferred.resolve(latestPosts);
    }else{
        Ham.model.table("contents").where("type","post").order(["cid","Z"]).limit(3).select().then(function(data){
            cache.set("latestPosts",data);
            deferred.resolve(data);
        });
    }
    return deferred.promise;
}