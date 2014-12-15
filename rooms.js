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
		turnOn : function(roomName, c){
			logger.info("preparing to turn on room ["+roomName+"]. room configs [" + JSON.stringify(configs.rooms) + "]");

			var room = utils.findRoom(roomName);


			if(room){
				// Cycle through lights and check to see if they're already on.
				// If they are on already, we don't want to override their current
				// display settings. This can allow someone to login - and get more
				// illumination without breaking the current accent / profile running
				var lightPromises = [];
				_.each(room.lights, function(lite){
					hue.lights.state.isOn(lite.id).then(function(isOn){
						if(!isOn){
							var change = c || {};
							change.on = true;
							change.transitiontime = 1;

							// hue.lights.state.isOn();
							var lightRsp = hue.lights.state.change(lite.id, change);
							lightPromises.push(lightRsp);
						}
					},
					function(err){
						logger.error("Error while attempting to check if light [" + lite.id + "] is on [%s]", err);
					});
				});

				return when.all(lightPromises).then(function(){
					logger.info("Welcome home. Room has been turned on.");
				}, function(err){
					logger.error("One of the lights failed to turn on! ["+err+"]")
				});	

			} else {
				return when.reject("invalid room");
			}
			
		},
		turnOff : function(roomName){
			logger.info("turning off room ["+roomName+"]");	
			var room = utils.findRoom(roomName),
					change = {on:false};

			if(room){
				return when.map(utils.lightsToIds(room.lights), hue.lights.turnOff).then(function(){
					logger.info("Let darkness reign! Room has been turned off.");
				}).catch(function(err){
					logger.error("One of the lights failed to turn off! ["+err+"]")
				});	

			} else {
				return when.reject("Invalid room");
			}
			
		}

	},
	toggleRoom : function(room, toggle){

		// var roomDef = utils.findRoom(room);

		// if(roomDef == undefined){
		// 	throw "Room ["+JSON.stringify(room)+"] was not found in definitions";
		// }
		
		if(toggle == undefined){
			_.each(room.lights, function(lite){
				hue.lights.toggle(lite.id);
			});
		} else {
			if(toggle == true){
				methods.roomControl.turnOn(room.lights);
			} else if(toggle == false){
				methods.roomControl.turnOff(room.lights);
			} else {
				logger.error("Invalid toggle value ["+toggle+"] boolean values must be used");
			}	
		}
		
	},
	validateApiRequest : function(req,resp){
		var roomName = req.body.room;
		logger.info("possible room ["+roomName+"]");
		// Attempt to find room
		var room = utils.findRoom(roomName);
		
		if(room != undefined || room == ""){
			resp.send(200);
			return room;
		} else {
			resp.send(500, {"error":100, "desc":"invalid room"});
			if(room == undefined){
				throw "Room ["+JSON.stringify(roomName)+"] was not found in definitions";
			}
		}
		
	}
};

server.put('/rooms/toggle',function(req,resp){
	logger.info("request received for /rooms/toggle");
	
	try{
		var room = methods.validateApiRequest(req, resp);
		methods.toggleRoom(room);
	} catch(e){
		logger.error("error toggling room ",e);
		resp.status(500);
	}
});

server.put('/rooms/illuminate',function(req,resp){
	logger.info("request received for /rooms/illuminate");
	
	try{
		var room = methods.validateApiRequest(req, resp);
		methods.toggleRoom(room, true);
	} catch(e){
		logger.error("error illuminating room ",e);
		resp.status(500);
	}
});

server.put('/rooms/darken',function(req,resp){
	logger.info("request received for /rooms/darken");

	try{
		var room = methods.validateApiRequest(req, resp);
		methods.toggleRoom(room, false);
	} catch(e){
		logger.error("error darken-ing(..?) room ",e);
		resp.status(500);
	}
	
});


server.put('/rooms/change',function(req,resp){
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