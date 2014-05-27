var _ = require("underscore");
var when = require("when");
var log4js = require("log4js");
var logger = log4js.getLogger("Rooms");

var hue = require("./hue-api");
var server = require("./rest");
var configs = require("./state");


var timers = {};

var methods = {
	init : function(){
		// init stuff
		
	},
	checkTime : function(){
		// var now = new Date();
		
		// if(now > configs.state.times.sunsetStart){
			// return true;
		// } else {
			// return false;
		// }
	},
	sunsetWatcher : {
		// start : function(){
			// console.log("Starting up sunset watcher");
			// if(timers.sunsetWatcher == undefined){
				// timers.sunsetWatcher = setInterval(function(){
					// methods.sunsetWatcher.interval();
				// },
				// 180000);
			// } else {
				// console.log("sunset time already started.");
			// }
		// },
		// stop : function(){
			// clearInterval(timers.sunsetWatcher);
			// timers.sunsetWatcher = undefined;
			// console.log("sunset watcher timer has been stopped.");
		// },
		// interval : function(){
			// if(methods.checkTime()){
				// methods.sunsetWatcher.stop();
				// methods.home();
			// }
		// }
	},
	home : function(){
		console.log("home hit");
		// var lights = configs.rooms.lights;
		// _.each(lights, function(light){
			// hue.lights.state.isOn(light).then(function(isOn){
				// var change = {};
				// if(isOn){
					// change.on = false;
				// } else {
					// if(methods.checkTime()){
						// change.on = true;
						// change.hue = configs.rooms.home.hue;
						// change.sat = configs.rooms.home.sat;
						// change.bri = configs.rooms.home.bri;
						// change.transitiontime = 1;
					// } else { 
						// console.log("Not late enough for lights yet.");
						// methods.sunsetWatcher.start();
					// }
				// }
				
				// if(!_.isEmpty(change)){
					// console.log("Changing state for light ["+light+"] to [", change, "]");
					// hue.lights.state.change(light, change);
				// }
			// }).otherwise(function(err){
				// console.log("error while attempting to setup home state", err);
			// });
		// });
	}
};

server.put({path:'/rooms/home'}, function(req, resp, next){
	logger.trace("request received for /rooms/home: ");
	
	// try{
	
		// //methods.home();
	
	// } catch(e){
		// console.error("error while attempting to process a home event",e);
	// }
	
	return next();
});

server.get({path : 'rooms'}, function(req, resp, next){
	console.log("gettin rooms");
	hue.lights.state.isOn(2);
});

module.exports = methods;