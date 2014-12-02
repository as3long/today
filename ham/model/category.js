var Category=module.exports;
var cache=require("./cache");
Category.selectAll=function(categorys){
   var deferred = getDefer();
   var categoryList=[];
   var promiseList=[];
   categorys.forEach(function(category){
        promiseList.push(Category.selectByName(category).then(function(data){
            categoryList.push(data);
        }))});
   Promise.all(promiseList).then(function(){
        deferred.resolve(categoryList);
   });
   return deferred.promise;
}
Category.selectByName=function(name){
    return Ham.model.table("metas").where({
        "type":"category",
        "name":name
    }).find();
}

Category.get=function(){
    var deferred = getDefer();
    var categorys=cache.get("categorys");
    if(categorys){
        deferred.resolve(categorys);
    }else{
        Ham.model.table("metas").where("type","category").select().then(function(data){
            cache.set("categorys",data);
            deferred.resolve(data);
        });
    }
    return deferred.promise;
}