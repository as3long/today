var Media=module.exports;
Media.updateParentAll=function(cid,urls){
   var deferred = getDefer();
   var promiseList=[];
    urls.forEach(function(url){
        promiseList.push(Media.updateParent(cid,url));
    })
    Promise.all(promiseList).then(function(){
       deferred.resolve(); 
    });
    return deferred.promise;
}

Media.updateParent=function(cid,url){
    return Ham.model.table("media").where("url",url).update({cid:cid});
}