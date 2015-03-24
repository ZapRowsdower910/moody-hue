/***
**	Transitions Plugin - Cycles a rooms lights through a random spectrum of colors. The colors move up at a random hue  **	   		interval, so the more lights added to a room the more deviation of color there will be.
**
**		- modes
** 			transitions - default transitions mode. This will use the transitions-mid configuraion values
**			transitions-heavy - Produces heavily saturated light values. Will reduce the overall light of the room
**										due to the heavily saturated colors
**			transitions-mid - Mid range saturation value. Will produce a decent amount of light while still providing an
**									acceptable amount of color
**			transitions-light - Lightly saturated values. Produces the most light, while still allowing lights to be colored
****/

var _ = require("underscore"),
	when = require("when"),
	log4js = require("log4js");

var log = log4js.getLogger("Transitions");

// local deps
var session = require("../session"),
	hue = require("../hue-api"),
	server = require("../express"),
	utils = require("../utils"),
	configs;

var validModes = [
		"transitions",
		"transitions-light",
		"transitions-mid",
		"transitions-heavy",
		"home"
	],
	timers = {
		rooms : undefined
	};

var methods = {
	cycle : function(room, mode){
		try{

			if(room && room.name){
				return methods.prepareChange(room);	
				// if(session.utils.setRoomFx(room.name, mode, pubs.stop, null, pubs.configs.level)){
					
				// } else {
				// 	log.info("unable to change fx using room [%s] and mode [%s]", JSON.stringify(room), mode);
				// 	return when.reject();
				// }
				
			} else {
				log.debug("Invalid room ["+room+"] for transitions");
				return when.reject();
			}

		} catch(e){
			log.error("Error during transition cycle: ", e);
			return when.reject();
		}
		
	},
	prepareChange : function(room){
		log.info("Starting transitions cycle for room [" + JSON.stringify(room) + "]");

		var set = [];

		_.each(room.lights,function(light){
			var pms = hue.lights.state.isOn(light.id).then(function(isOn){
				if(isOn == false){
					var promise = hue.lights.turnOnDim(light.id);
					promise.catch(function(e){
						log.error("turn on dim failed ["+JSON.stringify(e)+"]");
					});
					return promise;
				}
			},
			function(e){
				log.error("error finding if light ["+light.id+"] is on. err["+JSON.stringify(e)+"]");
			});

			set.push(pms);
		});

		return when.all(set).then(function(){
			methods.changeColor(room);
		});
	},
	changeColor : function(room){
		
		_.each(room.lights, function(light){
			var hueSet = session.state.current.transitions.hue,
					thisHue = utils.randomNumber(hueSet, (hueSet + configs.transitions.colorSlide)),
					bri = utils.randomNumber(configs.transitions.brightness.dim, configs.transitions.brightness.bright),
					trans = utils.converter.minToTransitionTime(configs.transitions.transitionTime),
					level = utils.getModeLevel(session.state.current.mode),
					sat = 50;

			// The hue value maxes out, if its greater than 65535 we want to wrap back to 0
			if(thisHue > 65535){
				thisHue = utils.randomNumber(0, configs.transitions.colorSlide);
			}

			// Update current color config
			session.state.current.transitions.hue = thisHue;

			if(configs.transitions.brightness.bright > 255){
				configs.transitions.brightness.bright = 255;
			}

			if(level == "light"){
				sat = utils.randomNumber(configs.transitions.satLevels.light[0],
					configs.transitions.satLevels.light[1]);
			} else if(level == "mid"){
				sat = utils.randomNumber(configs.transitions.satLevels.mid[0],
					configs.transitions.satLevels.mid[1]);
			} else if(level == "heavy"){
				var baseSat = configs.transitions.satLevels.heavy[0];
				// Adjust brighter sections of lite to a lower brightness
				// to maintain room light level
				if(thisHue > 10000 && thisHue < 43000){
					bri = utils.randomNumber(100, 175);
				}

				sat = utils.randomNumber(configs.transitions.satLevels.heavy[0],
					configs.transitions.satLevels.heavy[1]);

			} else {
				sat = utils.randomNumber(configs.transitions.satLevels.mid[0],
					configs.transitions.satLevels.mid[1]);
			}
			
			var change = {
				"bri" : bri,
				"sat" : sat,
				"hue" : thisHue,
				"transitiontime" : trans
			};

			log.debug("Changing light ["+light.id+"] to ["+JSON.stringify(change)+"]");
			hue.lights.state.change(light.id, change).then(function(){
				log.info("Successfully changed light ["+light.id+"]");
			});
			
		});
	}
};


/***
* Starts transitions in a different saturation level. A lower saturation level will result in a less colorful light, but a brighter room.
* Heavier saturated colors will result in illuminating the room less effienctly then a lightly saturated room. Default saturation 
* level is mid.
*
* Saturation ranges can be configured using the transitions configuration object satLevels (configs.transitions.satLevels). The
* values are the min and max values to use when picking a random saturation value.
*
* Valid str values are:
*		light - enable lightly saturated mode - uses configuration option configs.transitions.satLevels.light
*		mid - enable mid saturation mode - uses configuration option configs.transitions.satLevels.mid
*		heavy - enable heavy saturation mode - uses configuration option configs.transitions.satLevels.heavy
***/
server.put("/transitions/start/:str", function(req, res){
	try{

		var mode = "transitions-" + req.params.str,
				data = req.body;

		if(data && data.room){
			log.info("request for /transitions/start received - transition mode ["+mode+"] room ["+data.room+"]");
		
			pubs.start(data.room, mode).then(function(){
				res.send(200, {"error":0});

			}).catch(function(e){
				utils.apiFailure("/transitions/start/:str", res, e);
			});	
		} else {
			log.info("Invalid room received [%s]", data);
		}
		
	}catch(e){
		utils.restException("/transitions/start/:str", res, e);
	}
});

server.put("/transitions/stop", function(req, res){
	try{
		var data = req.body;

		if(data && data.room){
			pubs.stop(data.room).then(function(){
				res.send(200, {"error":0});

			}).catch(function(e){
				utils.apiFailure("/transitions/stop", res, e);
			});	
		} else {
			log.info("Invalid room received [%s]", data);
		}
		
	}catch(e){
		utils.restException("/transitions/stop", res, e);
	}
});

// Public Methods
var pubs = {
	configs : {
		name : "Transitions",
		type : "effect",
		id : utils.generateUUID(),
		level : 3
	},
	init : function(conf){
		log.info("Initializing transitions plugin");
		configs = conf;
		session.state.current.transitions = {};
		session.state.current.transitions.hue = 0;
	},
	start : function(roomName, mode){
		try{
			log.info("Attempting to start transitions on room ["+roomName+"] using mode ["+mode+"]");
			var room = utils.findRoom(roomName);

			return session.utils.setRoomFx(room.name, "transitions", pubs.stop).then(function(){

				if(room && timers[roomName] == undefined){
					// setup timer to re-run
					timers[roomName] = setInterval(function(){
						methods.cycle(room, mode);
					},
					utils.converter.minToMilli(configs.transitions.interval));
					// run it once
					return methods.cycle(room, mode);
				} else {
					log.error("Tranisitions is already started or the room [%s] is invalid", JSON.stringify(room));
					return when.resolve();
				}
			});
		} catch(e){
			log.error("Error while attempting to start transitions ["+e+"]");
			return when.reject();
		}
	},
	stop : function(roomName){
		var room = utils.findRoom(roomName);

		if(room){
			log.info("Stopping transitions");
			clearInterval(timers[room.name]);
			timers[room.name] = undefined;
			
			session.utils.setRoomFx(room.name, "none");

			return when.resolve();	
		} else {
			return when.reject("Unable to stop transitions, invalid room");
		}
		
	}
};

module.exports = pubs;