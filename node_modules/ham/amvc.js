var Class = require("./lib/Class");
var As3longMVC = {};
As3longMVC.utils = {
    isFunction: function (v) {
        return typeof v === 'function';
    },
    isArray: function (v) {
        return toString.apply(v) === "[object Array]";
    },
    isBoolean: function (obj) {
        return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    },
    isUndefined: function (obj) {
        return obj ===
            void 0;
    },
    isNull: function (obj) {
        return obj === null;
    },
    has: function (obj, key) {
        return hasOwnProperty.call(obj, key);
    },
    now: Date.now ||
        function () {
            return new Date().getTime();
    },
    isElement: function (obj) {
        return !!(obj && obj.nodeType === 1);
    }
};

As3longMVC.AObject = Class.extend({
    className:"As3longMVC.AObject"
});
As3longMVC.AEvent = As3longMVC.AObject.extend({
    className : "As3longMVC.AEvent",
    type : '',
    target:null,
    init:function(type){
        this.type=type;
    }
});

As3longMVC.EventDispatcher=As3longMVC.AObject.extend({
   className:"As3longMVC.EventDispatcher",
    dict : {},
    addEventListener : function (type, listener) {
        if (!As3longMVC.utils.isFunction(listener)) {
            throw new Error("指定的 listener 不是一个函数");
        }
        if (!this.dict[type]) {
            this.dict[type] = [];
        }
        this.dict[type].push(listener);
    },
    dispatchEvent : function (event) {
        var type = event.type;
        if (!this.dict[type]) {
            return;
        }
        var len = this.dict[type].length;
        for (var i = 0; i < len; i++) {
            this.dict[type][i](event);
        }
    },
    hasEventListener :function (type) {
        if (!this.dict[type]) {
            return false;
        } else {
            return true;
        }
    },
    removeEventListener: function (type, listener) {
        if (!this.dict[type]) {
            return;
        }
        var len = this.dict[type].length;
        for (var i = 0; i < len; i++) {
            if (listener == this.dict[type][i]) {
                this.dict.splice(i, 1);
                break;
            }
        }
    },removeAllEventListener : function (type) {
        if (!this.dict[type]) {
            return;
        }
        this.dict[type].length = 0;
    }
});

As3longMVC.BaseModel=As3longMVC.EventDispatcher.extend({
    className : "As3longMVC.BaseModel",
    target : this,
    _data: null,
    getData:function(){
        return this._data;
    },
    setData:function(value){
      this._data= value;
        this.dispatchEvent(As3longMVC.AEvent.create('data'));
    }
});

As3longMVC.BaseAction = As3longMVC.AObject.extend({
    className : "As3longMVC.BaseAction",
    run :null
});

As3longMVC.EventVO=As3longMVC.AObject.extend({
    className : "As3longMVC.EventVO",
    name:null,
    eventStr:null,
    callBack:null,
    init:function(name,eventStr,callBack){
        this.name = name;
        this.eventStr = eventStr;
        this.callBack = callBack;
    }
});

As3longMVC.instance;
As3longMVC.getInstance = function () {
    if (!As3longMVC.instance) {
        As3longMVC.instance = As3longMVC.As3longMVC.create();
    }
    return As3longMVC.instance;
}
As3longMVC.As3longMVC = As3longMVC.AObject.extend({
    className : "As3longMVC.As3longMVC",
    modelDict : {}
    ,classDict : {}
    ,modelEventDict : {}
    ,actionDict : {}
    ,debugColor : {
        black: '\x1b[30m\x1b[1m',
        red: '\x1b[31m\x1b[1m',
        green: '\x1b[32m\x1b[1m',
        yellow: '\x1b[33m\x1b[1m',
        orange: '\x1b[33m\x1b[1m',
        blue: '\x1b[34m\x1b[1m',
        pink: '\x1b[35m\x1b[1m',
        cyan: '\x1b[36m\x1b[1m',
        white: '\x1b[37m\x1b[1m'
    },
    /**
     * [输出调试信息 第一个参数如果为 ‘black red green yellow orange blue pink cyan white’ 则输出带颜色的调试信息]
     */
    debug : function () {
        if(!APP_DEBUG){
            return;
        }
        if (arguments[0] && this.debugColor[arguments[0]]) {
            console.log.apply(console,[this.debugColor[arguments[0]]].concat([].slice.call(arguments, 1)).concat(['\x1b[0m\x1b[1m']));
        } else {
            console.log.apply(console,arguments);
        }
    },
    registClass : function () {
        var len = arguments.length;
        for (var i = 0; i < len; i++) {
            this.classDict[arguments[i].className] = arguments[i];
        }
    },createAction : function (func, className) {
        var action = As3longMVC.BaseAction.extend({
            className:className,
            run:func
        }).create();
        this.registClass(action);
        return action;
    },createModel : function (className) {
        var model = As3longMVC.BaseModel.extend({
            className :className
        }).create();
        this.registClass(model);
        return model;
    },getModel:function (name) {
        if (!this.modelDict[name]) {
            if (!this.classDict[name]) {
                throw new Error("please regist " + name);
            }
            this.modelDict[name] = this.classDict[name];
        }
        return this.modelDict[name];
    },getAction : function (name) {
        if (!this.actionDict[name]) {
            if (this.classDict[name]) {
                this.actionDict[name] = this.classDict[name];
            } else {
                return;
            }
        }
        return this.actionDict[name];
    },bindModel : function (name, func, str) {
        str = str || "data";
        if (!this.modelEventDict[name]) {
            this.modelEventDict[name] = [];
        }
        var bindEventVO = As3longMVC.EventVO.create(name, str, func);
        this.modelEventDict[name].push(bindEventVO);
        if (!this.getModel(name).hasEventListener(str)) {
            this.getModel(name).addEventListener(str, bindEvent)
        }
        function bindEvent(e) {
            var modelEventVector = this.modelEventDict[name];
            e.target = this.getModel(name);
            for (var i = 0; i < modelEventVector.length; i++) {
                if (e.type == modelEventVector[i].eventStr) {
                    modelEventVector[i].callBack(e);
                }
            }
        }
    },unBindModel: function (name, func, str) {
        str = str ? str : "data";
        this.getModel(name).removeEventListener(str, func);
    }
});
module.exports = As3longMVC.getInstance();