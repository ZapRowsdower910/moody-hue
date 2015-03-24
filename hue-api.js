var needle = require("needle"),
	when = require("when"),
	_ = require("underscore"),
	log4js = require("log4js"),
	log = log4js.getLogger("Hue-Api");

// local deps
var configManager = require("./configManager"),
	hueUtils = require("./utils"),
	session = require("./session"),
	configs;

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
					console.log("detected put err on success resp")
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
		log.warn("delete has not been implemented");
	},
	setup : function(){
		var dfd = when.defer();
		log.debug("Requesting hue base server id from url [%s]", configs.hue.portalUrl);

		needle.get(configs.hue.portalUrl, function(err, resp){
			if(!err){
				
				var rsp = resp.body;
				if((rsp != undefined && rsp.length) && 
				   (rsp[0].internalipaddress != undefined && rsp[0].internalipaddress != ""))
				{
					configs.hue.baseIp = rsp[0].internalipaddress;
					log.info("Found local server ["+configs.hue.baseIp+"]");
					session.state.current.isScanningForBase = false;
					session.state.current.isSetup = true;
					
					dfd.resolve();
				} else {
					dfd.reject("invalid response back from base server [", rsp, "]");
				}
				
			} else {
				dfd.reject(err);
			}
		});
		
		return dfd.promise;
	},
	isSetup : function(){
		if(!session.state.current.isSetup 
			&& !session.state.current.isScanningForBase)
		{
			log.info("Setting up hue API");
			session.state.current.scanningForBase = true;

			if(configs.hue.baseIp && configs.hue.baseIp != ""){
				log.info("Attempting to use previous known base server id [%s]",configs.hue.baseIp);

				session.state.current.isScanningForBase = false;
				session.state.current.isSetup = true;

				return lights.state.get("").then(function(){
					log.info("Successful API message completed. Previous IP seems to be valid.");

					return true;

				}).catch(function(e){
					log.warn("Test request failed. Pulling server info from public api. Error:", e);

					session.state.current.isScanningForBase = false;
					session.state.current.isSetup = false;
					return api.setup();

				});
			} else {
				return api.setup();
			}
			
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
			
			log.info("Attempting to register user ["+configs.general.apiName+"] to Hue bridge");
			needle.post(configs.hue.baseIp + "/api", data, {json : true}, function(err,resp){
				if(!err){
					
					if(resp.body){
						var rsp = resp.body;
						
						if(!rsp[0].error){
							log.info("New API user created successfully");
							dfd.resolve();

						} else {
							if(resp.body[0].error.type == 7){
								dfd.reject("Check your apiName configuration - this fields needs to be between 10-40 characters long.");

							} else if(resp.body[0].error.type == 101){
								dfd.reject("Ok, you have 30 seconds to click the button on your bridge to authenticate this app before the request expires. If 30 seconds elapses, re-run the program to send another registration request.");

							} else {
								log.error(resp.body[0]);
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
				log.debug("light ["+lightId+"] is currently [" + (rsp.state.on ? "on" : "off") + "]");
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
			return api.get("/lights/" + lightId).then(function(d){
				// Add the current light id to the state resp
				d.id = lightId;
				return d;
			});
		}
	},
	turnOnDim : function(lightId){
		log.info("turning light [" +lightId+ "] on to dim setting");
		return lights.state.change(lightId, {"on" : true, bri : 1, sat: 20});
	},
	turnOn : function(lightId){
		log.info("turning light [" +lightId+ "] on");
		return lights.state.change(lightId, {"on" : true});
	},
	turnOff : function(lightId){
		log.info("turning light [" +lightId+ "] off");
		return lights.state.change(lightId, {"on" : false});
	},
	toggle : function(lightId){
		var dfd = when.defer();
		lights.state.get(lightId).then(function(data){
			if(data.state.on){
				lights.turnOff(lightId).then(function(){
					dfd.resolve(false);
				});
			} else {
				lights.turnOn(lightId).then(function(){
					dfd.resolve(true);
				});
			}
		});

		return dfd.promise;
	},
	getAll : function(){
		return lights.state.get("").then(function(d){
			var rtn = [];
			_.each(d, function(v,i){

				if(_.isObject(v)){
					v.id = i;
					rtn.push(v);	
				}
				
			});

			return rtn;
		});
	},
	blink : function(lightId, change, interval){
		var dfd = when.defer();

		lights.state.get(lightId).then(function(currentState){
			log.info("Blinking light ["+lightId+"]");
			var blinkIterations = currentState.state.on ? 10 : 11,
					limit = 0,
					finalChange = {},
					blinkTimer;
			
			blinkTimer = setInterval(function(){
				
				if(limit < blinkIterations){

					lights.state.isOn(lightId).then(function(isOn){
						change.on = !isOn;
						lights.state.change(lightId, change);
					},
					function(e){
						log.error("blink - isOn failed ["+e+"]");
					});

					limit++;	
				} else {
					clearInterval(blinkTimer);
					currentState.state.transitiontime = 10;
					finalChange = hueUtils.filterHueStateObj(currentState.state);

					log.debug("reverting back to original state ["+JSON.stringify(finalChange)+"]");

					if(!finalChange.on){
						delete finalChange.on;
						log.info("Removed on setting: ", finalChange);
					}

					// If light was originally off, change the light back to its original
					// color / bri then turn it off
					lights.state.change(lightId, finalChange).then(function(){
						if(!finalChange.on){
							lights.turnOff(lightId).then(function(){
								log.info("Blinking cycle completed. Light [" + lightId + "] as been reverted back to its original state (off)");
							});
						} else {
							log.info("Blinking cycle completed. Light [" + lightId + "] as been reverted back to its original state");
						}
						
					},
					function(e){
						log.error("blink - state change failed ["+JSON.stringify(e)+"]");
					});

					dfd.resolve();
				}

			}, interval);
		}, function(err){
			log.warn("Unable to get light ["+lightId+"] current settings to start blink phase.");
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
			log.debug("attempting to create group ["+name+"]");
			api.post("/groups", {"name" : name, "lights" : lights}, function(rsp){	
				log.info("Group was created successfully, updating groups light members");
				
				var group = _.find(configs.groups, function(v){
					if(g.name == name){
						return g;
					}
				});
				
				groups.setMembers(group);
			});
		} else {
			log.error("an array of lights is needed to create a group");
		}
	},
	state : {
		get : function(id){
			log.debug("Getting group state id [" + id + "]");
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

		// If the error is host unreachable and we have an IP address we may have
		// lost the hub. Try to re-pull the hub's IP address from the web
		if(err.code == "EHOSTUNREACH" &&
			configs.hue.baseIp != "")
		{
			log.info("Host unreachable error detected - pulling hubs IP fresh incase hubs IPs addy changed.");
			// Reset isSetup state
			session.state.current.isSetup = false;
			api.isSetup();	

		} else if(err.code == "ECONNRESET"){
			log.error("Connection reset by hue base server");

		} else {
			// Error is most likely a hue error
			utils.apiError(err);	
		}
		
	},
	apiError : function(err, details){
		try{
			log.error("Api resulted in an error response [", err,"] Event data [", (details != undefined ? details : ""), "]" );
		} catch (e){
			log.error("Error while attempting to be clever - hueApi.js - utils.apiError: ",e);
		}
		// General errors
		if(err.type == 1){
			log.error("The app has not been authenticated yet - have you finished the registration process?");
		} else if(err.type == 2){
			log.error("Bad request T_T");
		} else if(err.type == 3){
			log.error("This device doesn't exist - using correct id?");
		} else if(err.type == 4){
			log.error("That method type isn't valid for this rest path.");
		} else if(err.type == 5){
			log.error("Request type expected a body that was not sent - using correct rest path?");
		} else if(err.type == 6){
			log.error("Invalid request params included on the PUT request - check the Api.");
		} else if(err.type == 7){
			log.error("Paramter is out of range, or of incorrect type - check the API");
		} else if(err.type == 8){
			log.error("Read only paramater - can't be edited T_T");
		} else if(err.type == 901){
			log.error("Great now you gone and broke the bridge! Bridge internal error T_T");
			
			// specific errors for ceratin message types
		} else if(err.type == 101){
			log.error("Link button was not pressed in 30 seconds.");
		} else if(err.type == 201){
			log.error("Paramter not modifiable - is the device on?");
		} else if(err.type == 301){
			log.error("Groups appear to be full, please remove one to before adding another.");
		} else if(err.type == 302){
			log.error("Device has been added to max allotted groups - remove it from a group before attempting to add it to another group");
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
};

var general = {
	init : function(conf){
		configs = conf;
	}
}

// Export public objs
exports.api = api;
exports.lights = lights;
exports.groups = groups;
exports.init = general.init;