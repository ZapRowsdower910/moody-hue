/*****
**	v0.0.1
**	Twinkle
**
****/
var _ = require("underscore"),
	log4js = require("log4js"),
	logger = log4js.getLogger("Twinkle Plugin"),
	when = require("when");

// local deps
var session = require("../session"),
	server = require("../express"),
	hue = require("../hue-api"),
	utils = require("../utils"),
	configs;

var validModes = [
		"twinkle"
	],
	validLivingColors = [
		"LST001",	// Light Strips
		"LLC012"	// Bloom Lamp
	],
	timers = {rooms : undefined},
	local = {};

var methods = {
	cycle : function(roomName){
		try{

			var room = utils.findRoom(roomName),
					lottery,
					prms = [],
					ids = [];

			if(room && room.name ){
				if(session.utils.setRoomFx(room.name, "twinkle", null, pubs.configs.level)){
					session.utils.lock.byLevel(room.name, pubs.configs.level);

					lottery = methods.getRandomGroup(room.lights.length);
					logger.info("Random group selected: ", lottery);

					_.each(room.lights, function(lite, i){
						ids.push(lite.id);
					});

					return when.map(ids, hue.lights.state.get).then(function(dataz){

						_.each(dataz, function(d){
							var change = {
								"hue" : 20000,
								"sat" : 100,
								"bri" : 230,
								// "transitiontime" : 100
								// TODO: add/use config vals
								"transitiontime" : utils.converter.minToTransitionTime(configs.twinkle.transitionTime)
							};

							if(!d.state.on){
								change["on"] = true;
							}

							if(lottery.indexOf(d.id) > -1){
								change.hue = utils.randomNumber(0, 65535);
								change.sat = utils.randomNumber(180, 220);
							}

							logger.debug("Lite [%s] change: ", d.id, change);
							hue.lights.state.change(d.id, change).catch(function(err){
								logger.info("Error while attempting to setup twinkle", err);
							});	
						});
						
					});	
				}
				
			} else {
				logger.info("Unable to find room [%s]", JSON.stringify(room));
			}

		} catch(e){
			logger.error("Error during twinkle cycle: ", e);
		}
		
		// if we havent returned yet its an error case
		return when.reject();
	},
	getRandomGroup : function(lightCount){
		var needed = configs.twinkle.coloredLightCount,
			have = 0,
			group = [];

		logger.debug("Randomly selecting [%s] from a group of [%s]", needed, lightCount);
		while(have < needed){
			var candidate = utils.randomNumber(0, lightCount);
			if(group.indexOf(candidate) < 0){
				group.push(candidate);
				have++;
			}
		}
		return group;
	}
};


// Rest End Points
server.put("/twinkle/start", function(req,res){

	try{
		var data = req.body;

		if(data && data.room){
			logger.info("Request to start twinkle with room [%s]", data.room);

			pubs.start(data.room).then(function(){
				res.status(200).json({"error":0});

			}).catch(function(e){
				logger.info(arguments);
				utils.apiFailure("/twinkle/start", res, e);
			});	
		} else {
			logger.info("Invalid room received [%s]", data);
		}
		
	} catch(e){
		utils.restException("/twinkle/start", res, e);
	}
});

server.put("/twinkle/stop", function(req,res){

	try{
		var data = req.body;

		if(data && data.room){
			logger.info("Request to stop twinkle with room [%s]", data.room);

			pubs.stop(data.room).then(function(){
				res.status(200).json({"error":0});

			}).catch(function(e){
				utils.apiFailure("/twinkle/stop", res, e);
			});	
		} else {
			logger.info("Invalid room received [%s]", data);
		}
		
	} catch(e){
		utils.restException("/twinkle/stop", res, e);
	}
});


// Public Methods
var pubs = {
	configs : {
		name : "Twinkle",
		type : "effect",
		id : utils.generateUUID(),
		level : 4
	},
	init : function(conf){
		local.livinColors = [];
		configs = conf;
		// TODO: implement strict mode option
		// In strict mode only living color lights will be candidates for
		// being colored
		// To do this we will need to pull all the lights and then get the
		// current state on each. We should be able to use the id's to determine
		// which are living colors. But we may have problems finding a list of
		// all the ids. We might be able to use type too
	},
	start : function(roomName){
		try{
			logger.info("Attempting to start twinkle to room ["+roomName+"]");
			var room = utils.findRoom(roomName);

			if(room && timers[roomName] == undefined){
				// setup timer to re-run
				timers[roomName] = setInterval(function(){
					methods.cycle(room.name)
						.catch(function(e){
							logger.warn("Twinkle cycle failed [%s]", JSON.stringify(e));
						});
				},
				utils.converter.minToMilli(configs.twinkle.cycleTime));
				// run it once
				return methods.cycle(room.name);
			} else {
				logger.error("Twinkle is already started or the room [%s] is invalid", JSON.stringify(room));
				return when.resolve();
			}

		} catch(e){
			logger.error("Error while attempting to start twinkle ["+e+"]");
			return when.reject();
		}

	},
	stop : function(roomName){
		var room = utils.findRoom(roomName);

		if(room){
			logger.info("Stopping transitions");
			clearInterval(timers[room.name]);
			timers[room.name] = undefined;
			
			session.utils.setRoomFx(room.name, "none", null, 2);
			session.utils.unlock.byLevel(room.name, pubs.configs.level);

			return when.resolve();	
		} else {
			return when.reject("Invalid room");
		}
		
	}
};

module.exports = pubs;