  var BaseController=require("./BaseController");
   /**
   * [[实现通过基类字符串的继承 如: Ham.Controller("index",{})]]
   * @returns {[[Type]]} [[Description]]
   */
  module.exports = function () {
      if (arguments.length == 1) {
          return BaseController.extend(arguments[0]);
      } else {
          var controller = arguments[0];
          var superClass = require(APP_PATH + '/ham/controller/' + controller);
          return superClass.extend(arguments[1]);
      }
  };