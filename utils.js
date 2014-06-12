var _ = require("underscore");
var configs = require("./state");
var log4js = require("log4js");
var logger = log4js.getLogger("Utils");

var methods = {
	converter : {
		minToMilli : function(mins){
			return ((mins * 60) * 1000);
		},
		minToTransitionTime : function(mins){
			return ((mins * 60) * 10);
		},
		hrsToMilli : function(hrs){
			return (((hrs * 60) * 60) * 1000);
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
		return _.find(configs.rooms.definitions, function(v,i){
			if(v.name == roomName){
				return v;
			}
		});

	},
	requestError : function(){


	}
};

module.exports = methods;