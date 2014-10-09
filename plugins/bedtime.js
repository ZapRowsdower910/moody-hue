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
	moment = require("moment"),
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
			var now = moment(),
					wakeupToday = moment(now).set("hour", configs.bedtime.end).endOf("hour"),
					waitTime;

			if(!now.isBefore(wakeupToday)){
				logger.debug("Detected wakup time is tomorrow, adding a day to time");
				wakeupToday.add(1,"days");
			}

			waitTime = wakeupToday.diff(now);

			logger.info("Starting bedtime watcher, will wakeup in ["+utils.converter.milliToHrs(waitTime)+"] hrs");
			session.state.timers.bedtimeWatcher = setTimeout(
        methods.bedtimeWatcher.stop,
      waitTime);
		},
		stop : function(){
			logger.info("Stopping bedtime watcher");

			_.each(session.state.rooms, function(room,i){
				session.utils.unlock.byLevel(room.name, 8);
			});
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
			}).then(function(){
				_.each(session.state.rooms, function(room,i){
					// TODO: Consider what level to use when enabling room fx
					session.utils.setRoomFx(room.name, "sleepy-time", null, 8);
					// TODO: Consider the level to make this - most likely need to bump this up
					session.utils.lock.byLevel(room.name, 8);	
				});

				methods.bedtimeWatcher.start();
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

			_.each(session.state.rooms, function(room, i){
				session.utils.setRoomFx(room.name, 8);
				session.utils.unlock.byLevel(room.name, 8);
			});

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