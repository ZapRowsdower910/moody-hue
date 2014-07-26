var _ = require("underscore");
var when = require("when");
var delay = require("when/delay");
var log4js = require("log4js");
var logger = log4js.getLogger("Coment");

var hue = require("../hue-api");
// var server = require("../rest");
var server = require("../express");
var configs = require("../state");
var utils = require("../utils");

var methods = {
	actions : {
		init : function(){},
		start : function(){},
		stop : function(){}
	},
	startCycle : function(room){
		if(room == undefined){
			room = utils.findRoom(configs.coment.defaultRoom);
		} else {
			room = utils.findRoom(room);
		}

		if(room){
			console.log(room);
			if(room.lights){
				
				_.each(room.lights, function(v,i){
					var time = (configs.coment.speed * 1000);
					var interval = (time / room.lights.length) * i;
					methods.moveLight(v,interval);
				});
				
			} else {
				logger.warn("A room definition was found, but no lights are in the room. Configure some lights");
			}
		} else {
			logger.warn("No room found to use for coment. Set a default or pass one in through the api.");
		}
	},
	moveLight : function(light,time){
		if(time > 0){
			time = time - (100 * configs.coment.speed);
		}
		var change = configs.coment.profile;
		// var tranTime = (time / 100);
		var tranTime = 10;
		logger.info("calculated transitiontime ["+tranTime+"]");
		change["transitiontime"] = tranTime;
		if(!change.on){
			change.on = true;
		}
		var startTime = new Date();

		hue.lights.state.get(light).then(function(currentState){
			var getTime = new Date();
			var getPassed = getTime.getTime() - startTime.getTime();
			logger.info("["+light+"] time passed ["+getPassed+"] ["+startTime.getTime()+"] ["+getTime.getTime()+"]");

			var original = utils.filterHueStateObj(currentState.state);
			original["transitiontime"] = tranTime;

			logger.info("["+light+"] pre - wait is ["+time+"]");
			delay(123, time).then(function(){
				logger.info("starting state change for light ["+light+"]");

				hue.lights.state.change(light, change).then(function(){
						logger.info("Changed coment light ["+light+"] completed.");

						var changeBackTime = (tranTime * 100);
						logger.debug("Changing coment back in ["+changeBackTime+"]");
						delay(123, changeBackTime).then(function(){
							logger.info("["+light+"] starting change back to original");
							hue.lights.state.change(light, original).then(function(){
								logger.info("light ["+light+"] reverted back to original color successfully");
							}, 
							function(err){
								logger.error("Error while trying to revert back to original settings ["+light+"] ["+original+"]", err);
							});
						});
					},
					function(err){
						logger.info("failed to change light ["+light+"] ", err);
				});
			});
		});
	}
};

server.put("/coment/start/:room", function(req, resp){
	logger.info("request received for /coment/start");
	try{
		var room = req.params.room;
		methods.startCycle(room);
	} catch(e){
		// logger.error("error while attempting to start coment plugin ", e);
		utils.restError("coment/start/:room", resp, e);
	}
});

module.exports = methods;