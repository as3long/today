var utils=require("../common/utils");
var cache=require("./cache");
var Tags=module.exports;
Tags.addTags=function(tags){
   var deferred = getDefer();
   var tagList=[];
   var promiseList=[];
   tags.forEach(function(tag){
        promiseList.push(Tags.add(tag).then(function(data){
            tagList.push(data);
        }))});
   Promise.all(promiseList).then(function(){
        deferred.resolve(tagList);
   });
   return deferred.promise;
}
Tags.add=function(tag){
     var deferred = getDefer();
    Ham.model.table("metas").where({type:"tag",name:tag}).find().then(function(data){
        if(data.length>0){
            deferred.resolve({mid:data[0].mid,name:data[0].name});
        }else{
             Ham.model.table("metas").add({name:tag,type:"tag",slug:utils.pinyin(tag)}).then(
                Tags.selectLast().then(function(data){
                    deferred.resolve({mid:data[0].mid,name:data[0].name});
                })
             );
        }
    });
    return deferred.promise;
}

Tags.selectLast=function(){
    return Ham.model.table("metas").where("type","tag").order(["mid","Z"]).find();
}

Tags.deleteWhereCid=function(cid){
    return Ham.model.table("relationships").where("cid",cid).delete();
}

Tags.get=function(){
    var deferred = getDefer();
    var tagList=cache.get("tagList");
    if(tagList){
        deferred.resolve(tagList);
    }else{
        Ham.model.table("metas").where("type","tag").select().then(function(data){
            cache.set("tagList",data);
            deferred.resolve(data);
        });
    }
    return deferred.promise;
}