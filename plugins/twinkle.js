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
	local = {};

var methods = {
	cycle : function(){
		var roomName = "Living Room";
		var room = utils.findRoom(roomName);

		var prms = [],
				ids = [];

		var lottery = methods.getRandomGroup(room.lights.length);
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
		pubs.start().then(function(){
			res.status(200).json({"error":0});
		}).catch(function(e){
			var dets = utils.parseHueErrorResp(e);
			res.send(200, {
	  			"error":1001, 
	  			"errorDesc" : dets ? dets : ""
  			});
		});
		
	} catch(e){
		utils.restError("/twinkle/start", res, e);
	}
});

server.put("/twinkle/stop", function(req,res){

	try{
		pubs.stop().then(function(){
			res.status(200).json({"error":0});
		}).catch(function(e){
			var dets = utils.parseHueErrorResp(e);
			res.send(200, {
	  			"error":1001, 
	  			"errorDesc" : dets ? dets : ""
  			});
		});
		
	} catch(e){
		utils.restError("/twinkle/stop", res, e);
	}
});


// Public Methods
var pubs = {
	configs : {
		name : "Twinkle",
		type : "effect"
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
	start : function(){
		logger.info("Starting Twinkle..");

		session.state.current.mode = "twinkle";		

		if(session.state.current.twinkle == undefined){
			session.state.current.twinkle = {};
		}

		session.state.current.twinkle.timer = setInterval( 
			methods.cycle,
			utils.converter.minToMilli(configs.twinkle.cycleTime)
		);

		return methods.cycle();
	},
	stop : function(){
		clearInterval(session.state.current.twinkle.timer);
		session.state.current.mode = 'none';
		logger.info("Twinkle stopped");

		return when.resolve();
	}
};

module.exports = pubs;