/*****
**	v0.0.1
**	bedtime - A plugin to provide sleep state functionality. The idea is that
**	the bedtime plugin would be able to force a 'sleep' mode where automated
**	light cycling (like transitions plugin) are forced off. It would be able to
**	basically switch on/off from allowing low level plugins from being able to 
**	modify the state of a light.
**
*****/

var _ = require("underscore"),
	log4js = require("log4js"),
	logger = log4js.getLogger("Bedtime Plugin");

// local deps
// var server = require("../rest");
var session = require("../session"),
	server = require("../express"),
	hue = require("../hue-api"),
	utils = require("../utils"),
	configs;

var methods = {
	actions : {
		init : function(conf){
			configs = conf;
		},
		start : function(){

		},
		stop : function(){

		}
	},
	bedtimeWatcher : function(startTime){
		logger.info("Starting up bedtime monitor:", startTime);
		session.state.timers.bedtimeWatcher = setInterval(function(){
			if(session.state.current.mode == "bedtime"){
				// get now
				var now = new Date();
				
				// get the end time for the next day
				var endTime = new Date(startTime.getTime());
				endTime.setHours(configs.bedtime.end);
				endTime.setDate(startTime.getDate() + 1);
				
				if(now > endTime){
					logger.info("Good Morning! Looks like bedtimes over");
					// remove mode control
					session.state.current.mode = "none";
					// Clear timer
					clearInterval(session.state.timers.bedtimeWatcher);
				}
			} else {
				logger.info("Bedtime was canceled early? weak..");
				clearInterval(session.state.timers.bedtimeWatcher);
			}
		},
		utils.converter.minToMilli(configs.bedtime.watcherInterval));
	},
	sleepyTime : function(exceptions){
		if(exceptions == undefined){
			exceptions = [];
		}
		// Get all lights
		hue.lights.state.get("").then(function(rsp){
			_.each(rsp,function(v,i){
				if(exceptions.indexOf(parseInt(i)) < 0){
					hue.lights.turnOff(i);
				} else {
					hue.lights.turnOn(i);
				}
			});
			
			methods.bedtimeWatcher(new Date());
		});
	}
};

/**
*	Turns off all the lights but ones designated as the "Bedroom" under 
*	configs.rooms
*
**/
server.put('/bedtime/reading', function(req,resp){
	logger.info("Received /bedtime/reading request");
	try{
		var bedtimeGroup = utils.findRoom("Bedroom");

		// TODO: we a way to either reject all defereds to the hue-api or
		// to wrap the api in better error state handling...
		// Exception is thrown when light is turned off during a profile change 
		// that has 2 steps (turn on, brighten, change profile). This exception
		// can be prevented by always first querying the light bulb state before 
		// attempting to change it. However there should be a API exception thrown
		// to indicate bad state, which isn't being caught anywhere for some reason.
		if(bedtimeGroup){
			
			methods.sleepyTime(bedtimeGroup.lights);
			session.state.current.mode = "bedtime";
			resp.send(200);
			
		} else {
			logger.error("no bedtime room set found. Add a 'Bedtime' room under configs.rooms");
			logger.debug(configs);
			resp.send(500);
		}
		
	} catch (e){
		// logger.error("Error while attempting to go into bedtime mode: ", e);
		// resp.json(500);

		utils.restError("/bedtime/reading", resp, e);
	}
});

server.put('/bedtime/sleep', function(req,resp){
	logger.info("Received /bedtime/sleep request");
	try{
		
		methods.sleepyTime();
		session.state.current.mode = "sleep";
		
		resp.send(200);
	} catch (e){
		// logger.error("Error while attempting to go into bedtime mode: ", e);
		// resp.json(500);
		utils.restError("/bedtime/sleep", resp, e);
	}
});

server.put("/bedtime/wakeup",function(req,resp){
	logger.info("request received /bedtime/wakeup wakeup");

	try{

		var bedtimeGroup = utils.findRoom("Bedroom");

		if(bedtimeGroup){

			_.each(bedtimeGroup.lights, function(light){
				hue.lights.turnOn(light);
			});

			session.state.current.mode = "none";

			resp.send(200);
		} else {
			logger.error("no bedtime room set found. Add a 'Bedtime' room under configs.rooms");
			logger.debug(configs);
			resp.send(500);
		}

	}catch(e){
		utils.restError("/bedtime/wakeup", resp, e);
	}
});

module.exports = methods;