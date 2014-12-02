//定义APP的根目录
global.APP_PATH = __dirname;
//开启调试模式，线上环境需要关闭调试功能
global.APP_DEBUG = true;

//process.env.TMPDIR =APP_PATH+'/Runtime/Temp';
//console.log(JSON.stringify(process.env));

require("ham").run(80);