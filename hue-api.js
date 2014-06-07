var needle = require("needle");
var when = require("when");
var _ = require("underscore");
var log4js = require("log4js");
var logger = log4js.getLogger("Hue-Api");

// local deps
var configs = require("./state");

var api = {
	get : function(path){
		var dfd = when.defer();

		when(api.isSetup()).then(function(){
			needle.get(configs.hue.baseIp + "/api/" + configs.general.apiName + path, function(err, resp){
				if(!err){
					
					var rsp = resp.body;
					if(_.isArray(rsp) && rsp[0].error){
						utils.apiError(rsp[0]);
						dfd.reject(rsp[0]);
					} else {
						dfd.resolve(rsp);
					}
				} else {
					logger.warn("api level",err);
					var details = {
						path : configs.hue.baseIp + "/api/" + configs.general.apiName + path,
						args : arguments
					};
					utils.requestError(err,details);
					dfd.reject(err);
				}
			});
		});
		
		return dfd.promise;
	},
	post : function(path,data){
		var dfd = when.defer();
		
		when(api.isSetup()).then(function(){
			needle.post(configs.hue.baseIp + "/api/" + configs.general.apiName + path, data, {json : true}, function(err, resp){
				if(!err){
					dfd.resolve(resp.body);
				} else {
					utils.requestError(err);
					dfd.reject(err);
				}
			});
		});
		
		return dfd.promise;
	},
	put : function(path,data){
		var dfd = when.defer();
		
		when(api.isSetup()).then(function(){
			needle.put(configs.hue.baseIp + "/api/" + configs.general.apiName + path, data, {json : true}, function(err, resp){
				if(!err){
					dfd.resolve(resp.body);
				} else {
					utils.requestError(err);
				}
			});
		});
		
		return dfd.promise;
	},
	delete : function(){
		logger.warn("delete has not been implemented yet");
	},
	setup : function(){
		var dfd = when.defer();
		needle.get(configs.hue.portalUrl, function(err, resp){
			if(!err){
				
				var rsp = resp.body;
				if((rsp != undefined && rsp.length) && (rsp[0].internalipaddress != undefined && rsp[0].internalipaddress != "")){
					configs.hue.baseIp = rsp[0].internalipaddress;
					logger.info("Found local server ["+configs.hue.baseIp+"]");
					
					dfd.resolve();
				} else {
					logger.error("invalid response back from base server [", rsp, "]");
				}
				
			} else {
				dfd.reject(err);
			}
		});
		
		return dfd.promise;
	},
	isSetup : function(){

		if(configs.hue.baseIp == undefined || configs.hue.baseIp == ""){
			logger.info("Setting up hue API");
			return api.setup();
		}
		return true;
	}
};

var lights = {
	state : {
		isOn : function(lightId){		
			return api.get("/lights/" + lightId).then(function(rsp){
				logger.debug("light ["+lightId+"] is currently [" + (rsp.state.on ? "on" : "off") + "]");
				return rsp.state.on;
			});
		},
		change : function(lightId, stateChange){
			return api.put("/lights/" + lightId + "/state", stateChange).then(function(rsp){
				return utils.processArrayResp(rsp);
			});
		},
		changeSet : function(lightArray, stateChange){
			if(_.isEmpty(stateChange)){
				throw "A change is required.";
			}
			var lightPromises = [];
			_.each(lightArray, function(lightId){
				var promise = lights.state.change(lightId, stateChange);
				lightPromises.push(promise);
			});
			return lightPromises;
		},
		get : function(lightId){
			return api.get("/lights/" + lightId);
		}
	},
	turnOnDim : function(){
		logger.info("turning light [" +lightId+ "] on");
		return lights.state.change(lightId, {"on" : true, bri : 1, sat: 20});
	},
	turnOn : function(lightId){
		logger.info("turning light [" +lightId+ "] on");
		return lights.state.change(lightId, {"on" : true});
	},
	turnOff : function(lightId){
		logger.info("turning light [" +lightId+ "] off");
		return lights.state.change(lightId, {"on" : false});
	},
	blink : function(lightId, change, interval){
		var dfd = when.defer();

		lights.state.get(lightId).then(function(currentState){
			logger.info("Blinking light ["+lightId+"]");
			var blinkIterations = 10;

			var originalState = _.clone(currentState);
			
			var limit = 0;
			var blinkTimer = setInterval(function(){
				
				if(limit < 10){

					lights.state.isOn(lightId).then(function(isOn){
						change.on = !isOn;
						lights.state.change(lightId, change);
					});

					limit++;	
				} else {
					clearInterval(blinkTimer);
					lights.state.change(lightId, originalState).then(function(){
						logger.info("Blinking cycle completed. Light [" + lightId + "] as been reverted back to its original state");
					});

					dfd.resolve();
				}

			}, interval);
		}, function(err){
			logger.warn("Unable to get light ["+lightId+"] current settings to start blink phase.");
			dfd.reject();
		});

		return dfd.promise;
	}
};

var groups = {
	get : function(){
		return api.get("/groups");
	},
	add : function(name,lights){
		if(_.isArray(lights)){
			logger.debug("attempting to create group ["+name+"]");
			api.post("/groups", {"name" : name, "lights" : lights}, function(rsp){	
				logger.info("Group was created successfully, updating groups light members");
				
				var group = _.find(configs.groups, function(v){
					if(g.name == name){
						return g;
					}
				});
				
				groups.setMembers(group);
			});
		} else {
			logger.error("an array of lights is needed to create a group");
		}
	},
	state : {
		get : function(id){
			logger.debug("Getting group state id [" + id + "]");
			return api.get("/groups/" + id);
		},
		change : function(id, data){
			return api.put("/groups/" + id, data).then(function(rsp){
				return utils.processArrayResp(rsp);
			});
		}
	},
	setMembers: function(group){
		return groups.state.change(group.id, {"lights":group.lights});
	}
	
};

var utils = {
	requestError : function(err){
		logger.error("Api request resulted in an error", err);
	},
	apiError : function(err, details){
		try{
			logger.error("Api resulted in an error response [", err,"] Event data [", (details != undefined ? details : ""), "]" );
		} catch (e){
			logger.error("Error while attempting to be clever - hueApi.js - utils.apiError: ",e);
		}
		// General errors
		if(err.type == 1){
			logger.error("The app has not been authenticated yet - have you finished the registration process?");
		} else if(err.type == 2){
			logger.error("Bad request T_T");
		} else if(err.type == 3){
			logger.error("This device doesn't exist - using correct id?");
		} else if(err.type == 4){
			logger.error("That method type isn't valid for this rest path.");
		} else if(err.type == 5){
			logger.error("Request type expected a body that was not sent - using correct rest path?");
		} else if(err.type == 6){
			logger.error("Invalid request params included on the PUT request - check the Api.");
		} else if(err.type == 7){
			logger.error("Paramter is out of range, or of incorrect type - check the API");
		} else if(err.type == 8){
			logger.error("Read only paramater - can't be edited T_T");
		} else if(err.type == 901){
			logger.error("Great now you gone and broke the bridge! Bridge internal error T_T");
			
			// specific errors for ceratin message types
		} else if(err.type == 101){
			logger.error("Link button was not pressed in 30 seconds.");
		} else if(err.type == 201){
			logger.error("Paramter not modifiable - is the device on?");
		} else if(err.type == 301){
			logger.error("Groups appear to be full, please remove one to before adding another.");
		} else if(err.type == 302){
			logger.error("Device has been added to max allotted groups - remove it from a group before attempting to add it to another group");
		} else {
			logger.error("unregonized error type.");
		}
	},
	processArrayResp : function(rsp,dfd){
		var successList = [];
		var failedList = [];
		
		_.each(rsp, function(v){
			if(v.success){
				successList.push(v);
			} else {
				failedList.push(v);
			}				
		});
		
		// if we had failures pass back both lists
		if(failedList.length){
			return when.reject(failedList,successList);
		} else {
			return when.resolve(successList);
		}
	}
}

// Export public objs
exports.api = api;
exports.lights = lights;
exports.groups = groups;