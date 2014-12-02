today
=====
today是采用Ham框架写的一个简单的工作日志。

##Ham框架
- Ham框架采用sqlite作为数据库。使用[dblite](https://github.com/WebReflection/dblite)和[sql-query](https://github.com/dresende/node-sql-query)初步实现sql的对象化。
- Ham基于[es6-promise](https://github.com/jakearchibald/es6-promise)。所有的异步问题都由promise处理。
- Ham采用[lru-cache](https://github.com/isaacs/node-lru-cache)作为数据库缓存。
- Ham采用[xss](https://github.com/leizongmin/js-xss)实现初级防注入。
- Ham采用[formidable](https://github.com/felixge/node-formidable)接收post数据。
- Ham采用[mime](https://github.com/broofa/node-mime)处理静态资源
- Ham可以采用[ejs](https://github.com/tj/ejs)和[art-template](https://github.com/aui/artTemplate)作为模版引擎(today中采用的是art-template)。

## today
today的默认帐号
帐号：admin 密码：admin123

##感谢
- 感谢以上提到的开源项目的贡献。
- 模版中的样式有[lanxuan](https://github.com/lanxuan)提供