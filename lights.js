var needle = require("needle");

var lights = {
	state : {
		isOn : function(lightId){		
			return Client.get("/lights/" + lightId).then(function(rsp){
				console.log("light ["+lightId+"] is currently [" + (rsp.state.on ? "on" : "off") + "]");
				return rsp.state.on;
			});
		},
		change : function(lightId, stateChange){
			return Api.put("/lights/" + lightId + "/state", stateChange).then(function(rsp){
				return Api.processArrayResp(rsp);
			});
		},
		get : function(lightId){
			return Api.get("/lights/" + lightId);
		}
	},
	turnOn : function(lightId){
		console.log("turning light [" +lightId+ "] on");
		return lights.state.change(lightId, {"on" : true});
	},
	turnOff : function(lightId){
		console.log("turning light [" +lightId+ "] off");
		return lights.state.change(lightId, {"on" : false});
	}
};
module.exports = lights;