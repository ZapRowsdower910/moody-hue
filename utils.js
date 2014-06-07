
var methods = {
	convertMinToMilli : function(mins){
		return ((mins * 60) * 1000);
	},
	// Hue transition time is in the 100s of milli-seconds
	convertMinToTransitionTime : function(mins){
		return ((mins * 60) * 10);
	},
	randomNumber : function(min,max){
		return Math.floor(Math.random()*(max-(min+1))+(min+1));
	},
	getModeLevel : function(current){
		var parts = current.split("-");
		if(parts.length == 2){
			return parts[1];
		}
	},
	requestError : function(){


	}
};

module.exports = methods;