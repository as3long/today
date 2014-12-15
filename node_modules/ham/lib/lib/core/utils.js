module.exports = {
    /**
     * [合并对象]
     * @param {[Object]} o        [要合并的对象 o会合并n]
     * @param {[Object]} n        [被合并的对象 n被合并进o]
     * @param {[Bool]} override [是否覆盖属性]
     */
    merge: function (o, n, override) {
        for (var p in n){
            if (n.hasOwnProperty(p) && (!o.hasOwnProperty(p) || override)){
                o[p] = n[p];
            }
        }
    },
    /**
     * [对象转键值对数组]
     * @param   {Object} obj [要转换的键值对象]
     * @returns {Array}    [转换后的键数组和值数组] [keys,values]
     */
    objectToKeysAndValues: function (obj) {
        var keys = [];
        var values = [];
        for (var key in obj) {
            keys.push(key);
            values.push(obj[key]);
        }
        return [keys, values];
    }
};