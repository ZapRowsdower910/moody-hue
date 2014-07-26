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
		},
		function(err){
			dfd.reject(err);
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
		},
		function(err){
			dfd.reject(err);
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
					dfd.reject(err);
				}
			});
		},
		function(err){
			dfd.reject(err);
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
					configs.state.current.isScanningForBase = false;
					configs.state.current.isSetup = true;
					
					dfd.resolve();
				} else {
					dfd.reject("invalid response back from base server [", rsp, "]");
				}
				
			} else {
				utils.requestError(err);
				dfd.reject(err);
			}
		});
		
		return dfd.promise;
	},
	isSetup : function(){
		if(!configs.state.current.isSetup 
			&& !configs.state.current.isScanningForBase)
		{
			logger.info("Setting up hue API");
			configs.state.current.scanningForBase = true;
			return api.setup();
		}
		return true;
	},
	registerUser : function(){
		var dfd = when.defer();
		
		if(configs.general.apiName){
			var data = {
				devicetype : "moody-hues nodejs app",
				username : configs.general.apiName
			};
			
			logger.info("Attempting to register user ["+configs.general.apiName+"] to Hue bridge");
			needle.post(configs.hue.baseIp + "/api", data, {json : true}, function(err,resp){
				if(!err){
					// logger.info(resp);
					if(resp.body){
						var rsp = resp.body;
						// logger.info(rsp[0]);
						if(!rsp[0].error){
							logger.info("New API user created successfully");
							dfd.resolve();
						} else {
							if(resp.body[0].error.type == 7){
								dfd.reject("Check your apiName configuration - this fields needs to be between 10-40 characters long.");
							} else if(resp.body[0].error.type == 101){
								dfd.reject("Ok, you have 30 seconds to click the button on your bridge to authenticate this app before the request expires. If 30 seconds elapses, re-run the program to send another registration request.");
							} else {
								logger.error(resp.body[0]);
							}						
						}
					} else {
						dfd.reject("invalid response back from api register request. Unable to complete app registeration");
					}
				} else {
					dfd.reject(err);
				}
		});
			
			return dfd.promise;
		} else {
			return dfd.reject("Configuration field apiName is empty, please update config to include a valid apiName to register this app under");
		}
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
			if(!lightId){
				return false;
			}
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
	turnOnDim : function(lightId){
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
	toggle : function(lightId){
		return lights.state.get(lightId).then(function(data){
			if(data.state.on){
				return lights.turnOff(lightId);
			} else {
				return lights.turnOn(lightId);
			}
		});
	},
	blink : function(lightId, change, interval){
		var dfd = when.defer();

		lights.state.get(lightId).then(function(currentState){
			logger.info("Blinking light ["+lightId+"]");
			var blinkIterations = 10;

			// var originalState = _.clone(currentState.state);
			
			var limit = 0;
			var blinkTimer = setInterval(function(){
				
				if(limit < blinkIterations){

					lights.state.isOn(lightId).then(function(isOn){
						change.on = !isOn;
						lights.state.change(lightId, change);
					},
					function(e){
						logger.error("blink - isOn failed ["+e+"]");
					});

					limit++;	
				} else {
					clearInterval(blinkTimer);
					currentState.state.transitiontime = 10;
					logger.debug("reverting back to original state ["+JSON.stringify(currentState.state)+"]");
					lights.state.change(lightId, utils.filterHueStateObj(currentState.state)).then(function(){
						logger.info("Blinking cycle completed. Light [" + lightId + "] as been reverted back to its original state");
					},
					function(e){
						logger.error("blink - state change failed ["+JSON.stringify(e)+"]");
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
		// logger.error("Api request resulted in an error", err);
		utils.apiError(err);

		// If the error is host unreachable and we have an IP address we may have
		// lost the hub. Try to re-pull the hub's IP address from the web
		if(err.code == "EHOSTUNREACH"
			&& configs.hue.baseIp != "")
		{
			logger.info("Host unreachable error detected - pulling hubs IP fresh incase hubs IPs addy changed.");
			// Reset isSetup state
			configs.state.current.isSetup = false;
			api.isSetup();	
		}
		
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