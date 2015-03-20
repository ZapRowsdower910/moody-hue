var EventEmitter = require("events").EventEmitter,
  log4js = require("log4js"),
  log = log4js.getLogger("EventHelper");
 
var ee = new EventEmitter();

var methods = {
  publish : function(ev, data){
    return ee.emit(ev, data);
  },
  subscribe : function(ev, fn){
    return ee.on(ev, fn);
  }
}


ee.on("error", function(e){
  log.error("Caught error event:", e);
});

ee.on("room:001", function(e){
  log.info("Event fired!", arguments);
})

module.exports = methods;