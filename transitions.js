/***
**	Transitions Plugin - randomly cycles through colors on random lights
**		- modes
** 			- transitions - 
**			- transitions-heavy - 
****/

var _ = require("underscore");
var when = require("when");
var delay = require("when/delay");
var log4js = require("log4js");

var logger = log4js.getLogger("Transitions");

// local deps
var configs = require("./state");
var hue = require("./hue-api");
var server = require("./rest");
var utils = require("./utils");

var validModes = [
	"transitions",
	"transitions-light",
	"transitions-mid",
	"transitions-heavy",
	"home"
];

var timers = {
	cycles : null
};

var methods = {
	actions : {
		start : function(){
			try{
				logger.info("Attempting to start transitions");
				if(timers.cycles == null){
					// run it once
					methods.cycle();
					// setup timer to re-run
					timers.cycles = setInterval(function(){
						methods.cycle();
					},
					utils.convertMinToMilli(configs.transitions.interval));
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
		},
		init : function(){
			logger.info("Initializing transitions plugin");
			configs.state.current.transitions = {};
			configs.state.current.transitions.hue = 0;
			methods.actions.start();
		}
	},
	cycle : function(){
		if(validModes.indexOf(configs.state.current.mode) > -1){
			var room = configs.state.current.transitions.currentRoom;
			// If no room has been initialized, grab the defualt config
			if(room == undefined){
				// TODO: consider pulling the first room deff if default value is missing
				room = configs.rooms.definitions[configs.transitions.defaultRoom];
				configs.state.current.transitions.currentRoom = room;
			}
			logger.info("Starting transitions");
			methods.prepareChange(room);
		} else {
			logger.debug("Invalid state for transitions [" + configs.state.current.mode + "] valid ["+validModes+"]");
		}
	},
	prepareChange : function(room){
		logger.info("Starting transitions cycle for room ["+room.name+"]");

		var set = [];

		_.each(room.lights,function(lightId){
			hue.lights.state.isOn(lightId).then(function(isOn){
				if(isOn == false){
					var promise = hue.lights.turnOnDim(lightId);
					set.push(promise);
				}
			});
		});

		when.all(set).then(function(){methods.changeColor(room)});
	},
	changeColor : function(room){
		
		_.each(room.lights, function(lightId){
			var hueSet = configs.state.current.transitions.hue;
			var thisHue = utils.randomNumber(hueSet, (hueSet + 10000));
			if(thisHue > 65535){
				thisHue = utils.randomNumber(0, 10000);
			}
			// Update current color config
			configs.state.current.transitions.hue = thisHue;

			if(configs.transitions.brightness.bright > 255){
				configs.transitions.brightness.bright = 255;
			}
			var bri = utils.randomNumber(configs.transitions.brightness.dim, 
				configs.transitions.brightness.bright);

			var level = utils.getModeLevel(configs.state.current.mode);
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
					bri = utils.randomNumber(75, 150);
				}
				sat = utils.randomNumber(configs.transitions.satLevels.heavy[0],
					configs.transitions.satLevels.heavy[1]);
			} else {
				sat = utils.randomNumber(configs.transitions.satLevels.mid[0],
					configs.transitions.satLevels.mid[1]);
			}
			
			var trans = utils.convertMinToTransitionTime(configs.transitions.transitionTime);
			var change = {
				"bri" : bri,
				"sat" : sat,
				"hue" : thisHue,
				"transitiontime" : trans
			};
			logger.debug("Changing light ["+lightId+"] to ["+JSON.stringify(change)+"]");
			hue.lights.state.change(lightId, change).then(function(){
				logger.info("Successfully changed light ["+lightId+"]");
			});
		});
	}
};

server.put({path:"/transitions/start"}, function(req, res, next){
	try{
		logger.info("request for /transitions/start received");
		methods.actions.start();
	}catch(e){
		logger.error("Error while attempting start transitions ["+e+"]");
	}

	return next();
});

module.exports = methods;