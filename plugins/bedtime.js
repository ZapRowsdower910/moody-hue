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
	when = require("when"),
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
	// Not sure how I want this to work yet..
	bedtimeWatcher : {
		start : function(){
			logger.info("Starting bedtime watcher");
			session.state.timers.bedtimeWatcher = setInterval(
        methods.bedtimeWatcher.cycle,
      utils.converter.minToMilli(configs.bedtime.watcherInterval));
		},
		stop : function(){
			logger.info("Stopping bedtime watcher");
			clearInterval(session.state.timers.bedtimeWatcher);
		},
		cycle : function(){

		}
	},
	sleepyTime : function(exceptions){
		if(exceptions == undefined){
			exceptions = [];
		}

		logger.debug("turning off lights, except for: ", exceptions);

		return hue.lights.getAll().then(function(d){

			return when.map(d, function(lite, i){
				// Find the exceptions
				var turnOn = _.find(exceptions, function(v,i){
					return v.id == lite.id;
				});

				// If this light isn't in the exception list, turnOn will be
				// undefined - turn it off. Otherwise turn it on.
				if(!turnOn){
					hue.lights.turnOff(lite.id);
				} else {
					hue.lights.turnOn(lite.id);
				}
			});

		});

	},
	bedtime : function(){
		var roomToFind = configs.bedtime.bedroom,
				bedroom = utils.findRoom(roomToFind);

		// TODO: we a way to either reject all defereds to the hue-api or
		// to wrap the api in better error state handling...
		// Exception is thrown when light is turned off during a profile change 
		// that has 2 steps (turn on, brighten, change profile). This exception
		// can be prevented by always first querying the light bulb state before 
		// attempting to change it. However there should be a API exception thrown
		// to indicate bad state, which isn't being caught anywhere for some reason.
		if(bedroom){
			
			return methods.sleepyTime(bedroom.lights);
			
		} else {
			logger.error("Unable to find bedroom. Check configurations and make sure configs.bedtime.bedroom is a valid room");
			return when.reject({
				"error" : 100,
				"errorDesc" : "Invalid room"
			});
		}
	},
	wakeup : function(){
		var roomToFind = configs.bedtime.bedroom,
				bedroom = utils.findRoom(roomToFind);

		if(bedroom){

			session.state.current.mode = "none";
			clearInterval(session.state.timers.bedtimeWatcher);

			return when.map(bedroom.lights, function(lite){
				hue.lights.turnOn(lite.id);
			});
			
		} else {
			logger.error("Unable to find bedroom. Check configurations and make sure configs.bedtime.bedroom is a valid room");
			return when.reject({
				"error" : 100,
				"errorDesc" : "Invalid room"
			});
		}
	}
};

/**
*	Turns off all the lights but ones designated as the "Bedroom" under 
*	configs.rooms
*
**/
server.put('/bedtime/reading', function(req,resp){

	try{

		methods.bedtime().then(function(){
			session.state.current.mode = "bedtime";
			resp.send(200, {"error":0});
		}).catch(function(e){
			utils.apiFailure("/bedtime/reading", resp, e);
		});
		
	} catch (e){
		utils.restException("/bedtime/reading", resp, e);
	}
});

server.put('/bedtime/sleep', function(req,resp){
	try{

		methods.sleepyTime().then(function(){
			session.state.current.mode = "sleep";
			resp.send(200, {"error":0});
		}).catch(function(e){
			utils.apiFailure("/bedtime/sleep", resp, e);
		});

	} catch (e){
		utils.restException("/bedtime/sleep", resp, e);
	}
});

server.put("/bedtime/wakeup",function(req,resp){

	try{
		methods.wakeup().then(function(){
			resp.send(200, {"error":0});
		}).catch(function(e){
			utils.apiFailure("/bedtime/wakeup", resp, e);
		});

	}catch(e){
		utils.restException("/bedtime/wakeup", resp, e);
	}
});

var pubs = {
	configs : {
		name : "Bedtime",
		type : "service",
		level : 10,
		id : utils.generateUUID()
	},
	init : function(conf){
		configs = conf;
	},
	start : function(){

	},
	stop : function(){

	}
};

module.exports = pubs;