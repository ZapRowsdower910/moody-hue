/***
**	 v 0.0.1
** 
** 
** 
** 		Error Numbers
** 			- ?
***/

var _ = require("underscore"),
	when = require("when"),
	log4js = require("log4js"),
	logger = log4js.getLogger("LogMeIn");

var hue = require("../hue-api"),
	server = require("../express"),
	rooms = require("../rooms"),
	session = require("../session"),
	utils = require("../utils"),
	configs;

var timers = {};

var methods = {
	checkTime : function(){
		var now = new Date();
		logger.debug("Current time ["+now+"] - sunset is at ["+session.state.times.sunsetStart+"] compare result ["+now > session.state.times.sunsetStart+"]");
		if(now > session.state.times.sunsetStart){
			return true;
		} else {
			return false;
		}
	},
	home : function(state){
		logger.info("user logging ["+state+"]");

		var blinkChange = {
			sat : 255
		};

		if(state == "in"){
			logger.info("Log in request detected.");
			session.state.current.mode = "home";

			if(methods.checkTime()){
				rooms.roomControl.turnOn(configs.logMeIn.homeLights);

				// Display command status
				blinkChange.hue = configs.logMeIn.status.colors.welcome;
				hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);
			} else { 
				console.log("Not late enough for lights yet.");
				methods.sunsetWatcher.start();

				// Display command status
				blinkChange.hue = configs.logMeIn.status.colors.pending;
				hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);
			}


		} else if(state == "out"){			
			logger.info("Goodbye! I'll just shut off lights for ya..")
			session.state.current.mode = "notHome";

			methods.roomControl.turnOff(configs.logMeIn.homeLights);

			// Display command status
			blinkChange.hue = configs.logMeIn.status.colors.goodbye;
			hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);

			// Stop the watcher if its running
			methods.sunsetWatcher.stop;
		} else {
			logger.info("Unknown state detected ["+state+"]");

			// Display command status
			blinkChange.hue = configs.logMeIn.status.colors.unknown;
			hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);
		}

	},
	sunsetWatcher : {
		start : function(){
			logger.info("Starting up sunset watcher");
			if(timers.sunsetWatcher == undefined){
				timers.sunsetWatcher = setInterval(function(){
					methods.sunsetWatcher.interval();
				},
				180000); // 3 mins
			} else {
				logger.debug("sunset timer already started, no need to start another.");
			}
		},
		stop : function(){
			clearInterval(timers.sunsetWatcher);
			timers.sunsetWatcher = undefined;
			logger.info("sunset watcher timer has been stopped.");
		},
		interval : function(){
			if(methods.checkTime()){
				methods.sunsetWatcher.stop();
				methods.roomControl.turnOn(state.rooms.homeLights);
			}
		}
	}
}

/**
* Valid states are 
* - in
* - out
**/ 
server.put('/log/:state', function(req, resp){
	logger.trace("request received for /rooms/log: ");
	
	try{
	
		methods.home(req.params.state);
		resp.status(200).json({"error":0});
	
	} catch(e){
		logger.error("error while attempting to process a home event",e);
		resp.status(500);
	}
});

var pubs = {
	configs : {
		name : "Log me in",
		type : "service"
	},
	init : function(d){
		configs = d;
	},
	start : function(){},
	stop : function(){}
}

module.exports = pubs;