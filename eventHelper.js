var ee = require("events");

var methods = {
  publish : function(ev, data){
    return ee.emit(ev, data);
  },
  subscribe : function(ev, fn){
    return ee.on(ev, fn);
  }
}

return methods;