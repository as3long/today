var checkUser = function (name,password) {
    var deferred = getDefer();
    Ham.model.table("user").where({
        name:name
    }).find().then(function (data) {
        if (data && data.length > 0) {
            if(data[0].password==md5(password)){
                deferred.resolve(data);
            }else{
                deferred.reject(data);
            }
        } else {
            deferred.reject();
        }
    });
    return deferred.promise;
};

var addUser = function (name,password) {
    var item = {
        name:name,
        password: md5(password),
        created: parseInt(Date.now() / 1000)
    }
    return Ham.model.table('user').add(item);
};

var updateUser=function(id,obj){
    return Ham.model.table('user').where("id",id).update(obj);
}

module.exports={
    checkUser:checkUser,
    addUser:addUser,
    updateUser:updateUser
}