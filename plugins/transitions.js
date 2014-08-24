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
	delay = require("when/delay"),
	log4js = require("log4js");

var logger = log4js.getLogger("Transitions");

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
		cycles : null
	};

var methods = {
	cycle : function(){
		try{

			if(validModes.indexOf(session.state.current.mode) > -1){
				var room = session.state.current.transitions.currentRoom;
				// If no room has been initialized, grab the defualt config
				if(room == undefined){
					// TODO: consider pulling the first room deff if default value is missing
					room = configs.rooms[configs.transitions.defaultRoom];
					session.state.current.transitions.currentRoom = room;
				}

				return methods.prepareChange(room);
			} else {
				logger.debug("Invalid state for transitions [" + session.state.current.mode + "] valid ["+validModes+"]");
			}

		} catch(e){
			logger.error("Error during transition cycle: ", e);
		}
		
	},
	prepareChange : function(room){
		logger.info("Starting transitions cycle for room [" + JSON.stringify(room) + "]");

		var set = [];

		_.each(room.lights,function(light){
			var pms = hue.lights.state.isOn(light.id).then(function(isOn){
				if(isOn == false){
					var promise = hue.lights.turnOnDim(light.id);
					promise.catch(function(e){
						logger.error("turn on dim failed ["+JSON.stringify(e)+"]");
					});
					return promise;
				}
			},
			function(e){
				logger.error("error finding if light ["+light.id+"] is on. err["+JSON.stringify(e)+"]");
			});

			set.push(pms);
		});

		return when.all(set).then(function(){
			methods.changeColor(room);
		});
	},
	changeColor : function(room){
		
		_.each(room.lights, function(light){
			var hueSet = session.state.current.transitions.hue;
			var thisHue = utils.randomNumber(hueSet, (hueSet + configs.transitions.colorSlide));
			// The hue value maxes out, if its greater than 65535 we want to wrap back to 0
			if(thisHue > 65535){
				thisHue = utils.randomNumber(0, configs.transitions.colorSlide);
			}
			// Update current color config
			session.state.current.transitions.hue = thisHue;

			if(configs.transitions.brightness.bright > 255){
				configs.transitions.brightness.bright = 255;
			}
			var bri = utils.randomNumber(configs.transitions.brightness.dim, 
				configs.transitions.brightness.bright);

			var level = utils.getModeLevel(session.state.current.mode);
			var sat = 50;
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
			
			var trans = utils.converter.minToTransitionTime(configs.transitions.transitionTime);
			var change = {
				"bri" : bri,
				"sat" : sat,
				"hue" : thisHue,
				"transitiontime" : trans
			};
			logger.debug("Changing light ["+light.id+"] to ["+JSON.stringify(change)+"]");
			hue.lights.state.change(light.id, change).then(function(){
				logger.info("Successfully changed light ["+light.id+"]");
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
		var mode = "transitions-" + req.params.str;
		logger.info("request for /transitions/start received - transition mode ["+mode+"]");
		
		pubs.start(mode).then(function(){
			res.send(200, {"error":0});

		}).catch(function(e){
			var dets = utils.parseHueErrorResp(e);
	  	logger.error("/transitions/start/:str resulted in an error", dets);
			res.send(200, {
	  			"error":1001, 
	  			"errorDesc" : dets ? dets : ""
  			});
		});
		
	}catch(e){
		utils.restError("/transitions/start/:str", res, e);
	}
});

server.put("/transitions/stop", function(req, res){
	try{
		
		pubs.stop().then(function(){
			res.send(200, {"error":0});

		}).catch(function(e){
			var dets = utils.parseHueErrorResp(e);
	  	logger.error("/transitions/start/:str resulted in an error", dets);
			res.send(200, {
	  			"error":1001, 
	  			"errorDesc" : dets ? dets : ""
  			});
		});
		
	}catch(e){
		utils.restError("/transitions/start/:str", res, e);
	}
});

// Public Methods
var pubs = {
	configs : {
		name : "Transitions",
		type : "effect"
	},
	init : function(conf){
		logger.info("Initializing transitions plugin");
		configs = conf;
		session.state.current.transitions = {};
		session.state.current.transitions.hue = 0;
	},
	start : function(mode){
		try{
			logger.info("Attempting to start transitions");
			session.state.current.mode = mode ? mode : "transitions";
			if(timers.cycles == null){
				// setup timer to re-run
				timers.cycles = setInterval(function(){
					methods.cycle();
				},
				utils.converter.minToMilli(configs.transitions.interval));
				// run it once
				return methods.cycle();
			} else {
				logger.error("Transitions is already started");
			}
		} catch(e){
			logger.error("Error while attempting to start transitions ["+e+"]");
		}
	},
	stop : function(){
		logger.info("Stopping transitions");
		clearInterval(timers.cycle);
		timers.cycle = null;
		session.state.current.mode = "none";
		
		return when.resolve();
	}
};

module.exports = pubs;