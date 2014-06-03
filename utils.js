
var methods = {
	convertMinToMilli : function(mins){
		return ((mins * 60) * 1000);
	},
	// Hue transition time is in the 100s of milli-seconds
	convertMinToTransitionTime : function(mins){
		return ((mins * 60) * 10);
	}
};

module.exports = methods;