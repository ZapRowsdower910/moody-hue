var _ = require("underscore"),
	moment = require("moment"),
	log4js = require("log4js"),
	logger = log4js.getLogger("Utils");

var configs;

var methods = {
	init : function(conf){
		configs = conf;
	},
	converter : {
		minToMilli : function(mins){
			return ((mins * 60) * 1000);
		},
		minToTransitionTime : function(mins){
			return ((mins * 60) * 10);
		},
		hrsToMilli : function(hrs){
			return (((hrs * 60) * 60) * 1000);
		},
		milliToHrs : function(milli){
			return (((milli / 1000) / 60) / 60);
		}
	},
	randomNumber : function(min,max){
		return Math.floor(Math.random() * (max - (min + 1)) + (min + 1));
	},
	getModeLevel : function(current){
		var parts = current.split("-");
		if(parts.length == 2){
			return parts[1];
		}

		return;
	},
	filterHueStateObj : function(original){
		delete original.colormode;
		delete original.description;
		delete original.reachable;

		return original;
	},
	findRoom : function(roomName){
		return _.find(configs.rooms, function(v,i){
			if(v.name == roomName){
				return v;
			}
		});

	},
	lightsToIds : function(lights){
		var liteArray = [];

		if(lights){
			_.each(lights, function(l){
				liteArray.push(l.id);
			})	
		} else {
			throw "lights value [" + JSON.stringify(lights) + "] is invalid";
		}

		return liteArray;
	},
	colors : {
		toXY : function(){

		},
		toRGB : function(){

		}
	},
	isDarkOut : function(){	
		var now = new moment();
		if(now.isAfter(session.state.times.sunriseEnd)){
			return true;
		}

		return false;
	},
	generateUUID : function(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
	},
	apiFailure : function(path, res, e){
		logger.error("[%s] resulted in an error:", path, e || "");

		if(_.isObject(e)){
			// Custom error
			res.send(200, e);

		} else {
			// Generic error
			var dets = utils.parseHueErrorResp(e);

			res.send(200, {
  			"error":1001, 
  			"errorDesc" : dets || ""
			});
		}
		
	},
	restException : function(path, res, e){
		logger.error("Error while processing request [%s] exception: ", path, e);
		res.send(500);
	},
	parseHueErrorResp : function(res){
		var errs = [];

		_.each(res, function(e){
			if(e.error){
				errs.push(e.error.description);
			}
		});

		return errs;
	}
};

module.exports = methods;