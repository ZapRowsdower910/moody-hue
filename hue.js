var needle = require("needle");
var fs = require("fs");
var _ = require("underscore");
var sun = require("suncalc");

var nameTrigger = "accent";
var accentTimer = ((1000 * 60) * 5 ) // 5 minutes
var longitude = -81.3977210;
var latitude = 41.6986320;

var portalUrl = "http://www.meethue.com/api/nupnp";
var ip = "";
var apiName = "huey-moods"; //10-40 chars

var configs;

main = {
	init : function(){
		// load configuration file
		configs = JSON.parse( fs.readFileSync('conf.js', encoding="utf-8"));
		
		needle.get(portalUrl, main.setupLocal);
		
		var times = sun.getTimes(new Date(), latitude, longitude);
	},
	setupLocal : function(err, rsp){
		if(!err){
			if((rsp != undefined && rsp.body.length) && (rsp.body[0].internalipaddress != undefined && rsp.body[0].internalipaddress != "")){
				ip = rsp.body[0].internalipaddress;
				console.info("Found local server ["+ip+"]");
				
				main.registerApp.checkStatus();

			} else {
				console.error("unable to find your Hue local bridge. No can work.");
			}
		} else {
			main.requestError(err);
		}
	},
	registerApp : {
		checkStatus : function(){
			console.log("Checking app authentication status..");
			needle.get(ip + "/api/" + apiName, function(err, resp){
				if(!err){
					if(resp.body.lights){
						console.log("Successful api call made! We're is good to go");
						
						if(configs.accents.enabled){
							accents.init();
						}
						
					} else {
						if(resp.body[0].error.type == 1){
							console.log("Application has not yet been authenticated with bridge - starting activaction flow");
							main.registerApp.start();
						} else {
							main.apiError(rsp[0]);
						}
					}
				} else {
					main.requestError(err);
				}
			});
		},
		start: function(){
			if(apiName){
				var data = {
					devicetype : "nodejs app",
					username : apiName
				};
				needle.post(ip + "/api", data, {json : true}, main.registerApp.processResult);
			} else {
				console.log("Configuration field apiName is empty, please update config to include a valid apiName to register this app under");
			}
		},
		processResult : function(err,resp){
			if(!err){
				// console.log(resp);
				if(resp.body){
					var rsp = resp.body;
					// console.log(rsp[0]);
					if(!rsp[0].error){
						console.log("New API user created successfully");
					} else {
						if(resp.body[0].error.type == 7){
							console.error("Check your apiName configuration - this fields needs to be between 10-40 characters long.");
							console.error("Unable to continue, exiting");
						} else if(resp.body[0].error.type == 101){
							console.log("Ok, you have 30 seconds to click the button on your bridge to authenticate this app before the request expires. If 30 seconds elapses, re-run the program to send another registration request.");
						} else {
							main.apiError(resp.body[0]);
						}						
					}
				} else {
					console.log("invalid response back from api register request. Unable to complete app registeration");
				}
			} else {
				main.requestError(err);
			}
		}
	},
	requestError : function(err){
		console.error("Api request resulted in an error", err);
	},
	apiError : function(err){
		console.error("Api resulted  in an error response", err);
		// General errors
		if(err.type == 1){
			console.log("The app has not been authenticated yet - have you finished the registration process?");
		} else if(err.type == 2){
			console.log("Bad request T_T");
		} else if(err.type == 3){
			console.log("This device doesn't exist - using correct id?");
		} else if(err.type == 4){
			console.log("That method type isn't valid for this rest path.");
		} else if(err.type == 5){
			console.log("Request type expected a body that was not sent - using correct rest path?");
		} else if(err.type == 6){
			console.log("Invalid request params included on the PUT request - check the API.");
		} else if(err.type == 7){
			console.log("Paramter is out of range, or of incorrect type - check the API");
		} else if(err.type == 8){
			console.log("Read only paramater - can't be edited T_T");
		} else if(err.type == 901){
			console.log("Great now you gone and broke the bridge! Bridge internal error T_T");
			
			// specific errors for ceratin message types
		} else if(err.type == 101){
			console.log("Link button was not pressed in 30 seconds.");
		} else if(err.type == 201){
			console.log("Paramter not modifiable - is the device on?");
		} else if(err.type == 301){
			console.log("Groups appear to be full, please remove one to before adding another.");
		} else if(err.type == 302){
			console.log("Device has been added to max allotted groups - remove it from a group before attempting to add it to another group");
		}
	}
};

lights = {
	state : {
		isOn : function(lightId){
			needle.get(ip + "/api/" + apiName + "/lights/" + lightId, function(err, resp){
				if(!err){
					var rsp = resp.body;
					if(rsp.state){
						console.log(rsp.state);
						console.log("light is currently [" + (rsp.state.on ? "on" : "off") + "]");
						return rsp.state.on;
					} else {
						main.apiError(rsp[0]);
					}
				} else {
					main.requestError(err);
					
				}
			});
		},
		change : function(lightId, stateChange, callback){
			needle.put(ip + "/api/" + apiName + "/lights/" + lightId + "/state", stateChange, {json : true}, function(err, resp){
				if(!err){
					var rsp = resp.body;
					console.log(rsp);
					if(!rsp[0].error){
						return rsp;
					} else {
						main.apiError(rsp[0]);
					}
				} else {
					main.requestError(err);
				}
			});
		}
	},
	turnOn : function(lightId, callback){
	console.log("turning light [" +lightId+ "] on");
		lights.state.change(lightId, {"on" : true}, callback);
	},
	turnOff : function(lightId, callback){
		console.log("turning light [" +lightId+ "] off");
		lights.state.change(lightId, {"on" : false}, callback);
	},
};

groups = {
	init : function(callback){
		needle.get(ip + "/api/" +apiName + "/groups", function(err,resp){
			if(!err){
				var rsp = resp.body;
				if(!rsp.error){
					if(rsp.length == 0){
						
					}
					
				} else{
					
				}
			} else {
				main.requestError(err);
			}
		});
	},
	add : function(name){}
};

accents = {
	init : function(){
		accents.checkGroups();
	},
	checkGroups : function(){
		needle.get(ip + "/api/" + apiName + "/groups", function(err, resp){
			if(!err){
				var rsp = resp.body;
				if(!rsp[0]){
					console.log(rsp);
					// Build a list of unique groups we need
					var uniqueGroups = [];
					_.each(configs.accents.profiles, function(profile){
						if(uniqueGroups.indexOf(profile.group) < 0){
							uniqueGroups.push(profile.group);
						}
					});
					console.log("Unique groups:",uniqueGroups);
					
					var profileGroups = [];
					// Find which groups we need to add
					_.each(_.values(rsp), function(v,k){
						if(_.contains(uniqueGroups, v.name)){
							profileGroups.push(v.name);	
						}
					});
					console.log("profileGroups:", profileGroups);
					var neededGroups = _.difference(uniqueGroups, profileGroups);
					console.log("neededGroups:", neededGroups);
					if(neededGroups.length){
						_.each(neededGroups, function(v,i){
							console.log(v,i);
							_.each(_.values(configs.groups), function(j,k){
								console.log(k,j);
							});
						});
					}
				} else {
					main.apiError(rsp[0]);
				}
			} else {
				main.requestError(err);
			}
		});
	},
	addGroup : function(name,lights){
		if(_.isArray(lights)){
			needle.post(ip+ "/api/" + apiName + "/groups", {"name" : name, "lights" : lights}, function(err, resp){
				if(!err){
					var rsp = resp.body;
					console.log(rsp);
					
				} else {
					main.requestError(err);
				}
			});
		} else {
			console.error("an array of lights is needed to create a group");
		}
	}
};

main.init();