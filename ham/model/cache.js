var LRU = require("lru-cache")
, options = { max: 200,maxAge: 1000 * 60 * 60 }
var cache = LRU(options)
module.exports=cache;