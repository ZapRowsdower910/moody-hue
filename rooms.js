/***
**	 v 0.0.1
**
** 		A module to control hue lights by defined rooms. The intention of this plugin is to make it easier to
**		apply effects to an entire room.
** 
** 		Room definitions are defined in configurations under configs.rooms
** 		A room is comprised of a name and an array of light Id's
** 
** 		Error Numbers
** 			- 100 - Indicates an invalid room argument
***/

var _ = require("underscore"),
	when = require("when"),
	log4js = require("log4js"),
	logger = log4js.getLogger("Rooms");

var hue = require("./hue-api"),
	server = require("./express"),
	// server = require("./rest"),
	session = require("./session"),
	utils = require("./utils"),
	configs;

var methods = {
	init : function(conf){
		// init stuff
		configs = conf;
	},
	
	roomControl : {
		change : function(room,change){
			logger.info("changing lights ["+room+"] change ["+JSON.stringify(change)+"]");
			_.each(room.lights,function(i){
				hue.lights.state.change(i, change);
			});
		},
		turnOn : function(lights){
			logger.info("preparing to turn on room. room configs [" + JSON.stringify(configs.rooms) + "]");

			// Cycle through lights and check to see if they're already on.
			// If they are on already, we don't want to override their current
			// display settings. This can allow someone to login - and get more
			// illumination without breaking the current accent / profile running
			var lightPromises = [];
			_.each(configs.rooms.homeLights, function(lightId){
				hue.lights.state.isOn(lightId).then(function(isOn){
					if(!isOn){
						var change = _.clone(configs.rooms.homeState)	;
						change.on = true;
						change.transitiontime = 1;

						hue.lights.state.isOn();
						var lightRsp = hue.lights.state.change(lightId, change);
						lightPromises.push(lightRsp);
					}
				},
				function(err){
					logger.error("Error while attempting to check if light [" + lightId + "] is on [%s]", err);
				});
			});

			return when.all(lightPromises).then(function(){
				logger.info("Welcome home. Room has been turned on.");
			}, function(err){
				logger.error("One of the lights failed to turn on! ["+err+"]")
			});
			
		},
		turnOff : function(lights){
			logger.info("turning off room, using lights ["+lights+"]");			

			var change = {on:false};
			var lightRsp = hue.lights.state.changeSet(lights,change);
			
			return when.all(lightRsp).then(function(){
				logger.info("Let darkness reign! Room has been turned off.");
			}, function(err){
				logger.error("One of the lights failed to turn off! ["+err+"]")
			});
		}

	},
	toggleRoom : function(room, toggle){

		var roomDef = utils.findRoom(room);

		if(roomDef == undefined){
			throw "Room ["+JSON.stringify(room)+"] was not found in definitions";
		}
		
		if(toggle == true){
			methods.roomControl.turnOn(roomDef.lights);
		} else if(toggle == false){
			methods.roomControl.turnOff(roomDef.lights);
		} else {
			logger.error("Invalid toggle value ["+toggle+"] boolean values must be used");
		}
		
	},
	validateApiRequest : function(req,resp){
		var room = req.params.room;
		logger.info("possible room ["+room+"]");
		// Attempt to find room
		var roomDef = utils.findRoom(room);
		
		if(roomDef != undefined || roomDef == ""){
			resp.send(200);
			return roomDef;
		} else {
			resp.send(500, {"error":100, "desc":"invalid room"});
			if(roomDef == undefined){
				throw "Room ["+JSON.stringify(room)+"] was not found in definitions";
			}
		}
		
	}
};

server.put('/rooms/illuminate/:room',function(req,resp){
	logger.info("request received for /rooms/illuminate");
	
	try{
		var room = methods.validateApiRequest(req, resp);
		methods.toggleRoom(room, true);
	} catch(e){
		logger.error("error illuminating room ",e);
		resp.status(500);
	}
});

server.put('/rooms/darken/:room',function(req,resp){
	logger.info("request received for /rooms/darken");

	try{
		var room = methods.validateApiRequest(req, resp);
		methods.toggleRoom(room, false);
	} catch(e){
		logger.error("error darken-ing(..?) room ",e);
		resp.status(500);
	}
	
});


server.put('/rooms/change/:room',function(req,resp){
	logger.info("request received for /rooms/change");
	
	try{
		var room = methods.validateApiRequest(req, resp);
		var body = JSON.parse(req.body);
		methods.change(room, body);
	} catch(e){
		logger.error("error changing room ",e);
		resp.status(500);
	}
	
});

module.exports = methods;