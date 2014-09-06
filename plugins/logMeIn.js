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
	logger = log4js.getLogger("LogMeIn"),
	moment = require("moment");

var hue = require("../hue-api"),
	server = require("../express"),
	rooms = require("../rooms"),
	session = require("../session"),
	utils = require("../utils"),
	configs;

var timers = {}, local = {};

var methods = {
	checkTime : function(){
		logger.debug("Current time ["+new Date()+"] - sunset is at ["+session.state.times.sunsetStart+"] sunrise is at ["+session.state.times.sunrise+"]");

		if(moment().isAfter(session.state.times.sunsetStart) ){
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
				return rooms.roomControl.turnOn(configs.logMeIn.homeRoom).then(function(){
					// Display command status
					blinkChange.hue = configs.logMeIn.status.colors.welcome;
					hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);	
				});

			} else { 
				logger.info("Not late enough for lights yet.");
				methods.sunsetWatcher.start();

				// Display command status
				blinkChange.hue = configs.logMeIn.status.colors.pending;
				hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);
			}

		} else if(state == "out"){			
			var roomArray = [];
			logger.info("Goodbye! I'll just shut off lights for ya..");

			_.each(configs.rooms, function(r){
				roomArray.push(r.name);
			});
console.log("turning off", roomArray)
			return when.map(roomArray, rooms.roomControl.turnOff).then(function(){

			// return rooms.roomControl.turnOff(configs.logMeIn.homeLights).then(function(){
				session.state.current.mode = "notHome";
				// Stop the watcher if its running
				methods.sunsetWatcher.stop();

				// Display command status
				blinkChange.hue = configs.logMeIn.status.colors.goodbye;
				hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);	
			});
			
		} else {
			logger.info("Unknown state detected ["+state+"]");

			// Display command status
			blinkChange.hue = configs.logMeIn.status.colors.unknown;
			hue.lights.blink(configs.logMeIn.status.light, blinkChange, 1000);
		}

		return when.resolve();

	},
	sunsetWatcher : {
		start : function(){
			
			if(timers.sunsetWatcher == undefined){
				logger.info("Starting up sunset watcher");

				// Startup using the long check
				local.longCheck = true;

				timers.sunsetWatcher = setInterval(function(){
					try{
						methods.sunsetWatcher.interval();
					} catch(e){
						logger.error("sunset watcher cycle exception", e);
					}
					
				},
				utils.converter.minToMilli(configs.logMeIn.watcher.long));

				// After setting up out watcher we run through one interval to ensure
				// we don't need to switch to a short check
				methods.sunsetWatcher.interval();
			} else {
				logger.debug("sunset timer already started, no need to start another.");
			}
		},
		stop : function(){
			clearInterval(timers.sunsetWatcher);
			timers.sunsetWatcher = undefined;
			session.state.current.mode = 'none';
			logger.info("sunset watcher timer has been stopped.");
		},
		interval : function(){

			if(methods.checkTime()){
				rooms.roomControl.turnOn(configs.logMeIn.homeLights);
				methods.sunsetWatcher.stop();
			} else {

				if(local.longCheck){
					// if its not sunset yet we should check to see if sunset will occur
					// before out next long check
					var lengthCheck = new moment().add(configs.logMeIn.watcher.long, "m");
					if(lengthCheck.isAfter(session.state.times.sunsetStart)){
						logger.info("Sunset will occur before next long check, switching to short checks");

						clearInterval(timers.sunsetWatcher);

						// Set state as short checks
						local.longCheck = false;

						// setup new interval using short checks
						timers.sunsetWatcher = setInterval(
	           	methods.sunsetWatcher.interval,
	           	utils.converter.minToMilli(configs.logMeIn.watcher.short)
	         	);
					}
				} // implied else - already using short check nothing to do but wait..
				
			} // close checkTime()

		} // close interval

	} // close sunsetWatcher
};

/**
* Valid states are 
* - in
* - out
**/ 
server.put('/log/:state', function(req, res){
	try{

		methods.home(req.params.state).then(function(){
			res.status(200).json({"error":0});

		}).catch(function(e){
			var dets = utils.parseHueErrorResp(e);
			res.send(200, {
	  			"error":1001, 
	  			"errorDesc" : dets ? dets : ""
  			});
		});
		
	} catch(e){
		utils.restException("/log/:state", res, e);
	}
});

var pubs = {
	configs : {
		name : "Log me in",
		type : "service",
		id : utils.generateUUID()
	},
	init : function(d){
		configs = d;
	},
	start : function(){

	},
	stop : function(){}
}

module.exports = pubs;