/***
**	v0.0.1 
**
**	Currently broken - mid refactor
**
**	Accents Plugin - cycle through different light profiles
**		- modes
** 			- accents - Accents mode will cycle a room through different color profiles.
**			- accents-bright - 
**			- accents-
****/

var _ = require("underscore");
var when = require("when");
var delay = require("when/delay");
var log4js = require("log4js");

var logger = log4js.getLogger("Accents");

// local deps
var configs = require("../state");
var hue = require("../hue-api");
var server = require("../rest");
var utils = require("../utils");

var validModes = [
	"accents",
	"accents-bright",
	"home"
];

var validBrightLights = [
	"Extended color light"
];

var timers = {};

var data = {};

methods = {
	actions : {
		init : function(){
			logger.info("Attempting to startup Accents");

				try{
					configs.state.accents = {};
					configs.state.current.accents = {};

					// convert minutes to seconds
					configs.accents.timer = utils.converter.minToMilli(configs.accents.timer);
					configs.accents.transitionTime = utils.converter.minToTransitionTime(configs.accents.transitionTime);

					// // Transition time must be lower than timer
					// var adjustedTime = configs.accents.timer / 100;
					// if(adjustedTime < configs.accents.transitionTime){
					// 	configs.accents.transitionTime = adjustedTime - 1000;
					// 	if(configs.accents.transitionTime <= 0){
					// 		configs.accents.transitionTime = 1;
					// 	}
					// 	logger.warn("Accents transition time is configured higher than the accent profile timer. The transiiton timer must be set to a larger value to give the bulbs enough time to complete their color change. Transition time has been adjusted to ["+configs.accents.transitionTime+"]");
						
					// }

					methods.buildActiveGroups();

					// Find the default room
					configs.state.accents.defaultRoom = _.find(configs.rooms.definitions, function(v){
						return v.name == configs.accents.defaultRoom;
					});
					
					logger.debug("Default room set to ["+configs.state.accents.defaultRoom.name+"]");
					configs.state.current.accents.room = configs.state.accents.defaultRoom;

				} catch (e){
					logger.error("Exception while attempting to init Accents", e);
				}

		},
		start : function(){
			logger.info("Enabling Accent mode");
			// lock in our mode
			configs.state.current.mode = "accents-bright";	
			
			// Start change immedately
			methods.startChange();
			
			if(timers.accents == null){
				// if accents is running already, we should clear out the previous timer and restart it.
				// This will ensure our fresh run wont change too early on the first cycle
				clearInterval(timers.accents);
			}
			
			// setup future changes
			timers.accents = setInterval(function(){
				methods.startChange();
			},
			configs.accents.timer);
		},
		stop : function(){
			logger.info("Disabling Accent mode");
			configs.state.current.mode = "none";
			
			clearTimer(timers.accents);
			
			return true;
		}
	},
	buildActiveGroups : function(){
		
		// Build a list of unique groups and profiles we need
		data.uniqueGroups = [];
		data.mergedProfiles = [];
		_.each(configs.accents.profiles, function(profile){
			if(data.uniqueGroups.indexOf(profile.group) < 0){
				// collect distinct group names
				data.uniqueGroups.push(profile.group);
				// collect distinct profiles
				data.mergedProfiles.push(profile);
			}
		});
		
		_.each(configs.groups, function(v){
			_.find(data.mergedProfiles,function(profile){
				if(v.name == profile.group){
					profile.lights = v.lights;
					return true;
				}
			});
		});

	},
	startChange : function(){
		try{
			if(validModes.indexOf(configs.state.current.mode) > 0){

				var now = new Date();
				if((configs.accents.waitForDark && now < configs.state.times.sunriseEnd )
					|| (configs.accents.waitForDark && now > configs.state.times.sunsetStart)
					|| !configs.accents.waitForDark)
				{
					logger.info("Looks like its dark enought for Accents mode. Starting accent cycle.");
					if(configs.state.times.rolloverTime < now){
						main.refreshTimes();
					}
					
					var nextProfile = methods.getNextProfile();
					var currentProfile = methods.getCurrentProfile();

					methods.changeProfile(currentProfile, nextProfile);

				} else {
					logger.debug("Not dark enough for accents. Accents will start at ["+configs.state.times.sunsetStart+"]");
				}
			} else {
				logger.info("Invalid state of ["+configs.state.current.mode+"] unable to start accents");
			}
		} catch(e){
			logger.error("error while attempting to change accents", e);
		}
	},
	changeProfile : function(currentProfile, nextProfile){

		try{
			var change = {
				hue : nextProfile.hue,
				sat : nextProfile.sat,
				transitiontime : configs.accents.transitionTime,
			}
			
			// if no profile level brightness is set, use the default level
			if(nextProfile.bri){
				change.bri = nextProfile.bri;
			} else {
				change.bri = configs.accents.bri;
			}

			logger.info("Changing Accent light to profile ["+nextProfile.name+"] using group ["+nextProfile.group+"] to [", change, "]");
			methods.syncLights(currentProfile, nextProfile, change).done(function(){
				logger.info("profile change complete");
				configs.state.current.profile = nextProfile.group;
			});
		} catch(e){
			logger.info("error while trying to change profile: ", e);
		}
	},
	syncLights : function(currentProfile, nextProfile, change){
		var actionList = [];

		var nextProfileLights = _.clone(nextProfile.lights);
		var briLight = -1;
		// Turn on one light from the room for light
		var lightsNotInUse = _.difference(configs.state.current.accents.room.lights, nextProfile.lights);
		logger.info("Lights in room not being used by current active profile ["+lightsNotInUse+"]");
		if(lightsNotInUse.length){
			logger.debug("Total number of lights to choose from ["+lightsNotInUse.length+"]");
			// TODO: pick a random index
			// briLightIndex = Math.floor(Math.random() * lightsNotInUse.length) + 1;
			briLightIndex = methods.randomLight(lightsNotInUse);
			logger.debug("briLightIndex generated ["+briLightIndex+"]");
			briLight = lightsNotInUse[briLightIndex];
			logger.info("Random light ["+briLight+"] selected for bright light");
			nextProfileLights.push(briLight);
		}

		// Turn off lights that are no longer needed
		// if(currentProfile != undefined){
			var roomLights = configs.state.current.accents.room.lights;
			console.log("The current rooms light configuration ["+roomLights+"]");
			var onList = [];
			var dfdList = []
			_.each(roomLights, function(lightId){
				var promise = hue.lights.state.isOn(lightId).then(function(isOn){
					if(isOn){
						onList.push(lightId);
					}
				});
				dfdList.push(promise);
			});

			when.all(dfdList).then(function(){
				// first turn off any ligths that are not needed anymore
				logger.info("current light set [" + onList + "] next light set [" + nextProfileLights + "]");
				var oldLights = _.difference(onList,nextProfileLights);
				if(oldLights.length){
					logger.info("Light Ids that need to be turned off [" + oldLights  + "]");
					_.each(oldLights, function(v){
						// if(hue.lights.state.isOn(v).then(function(){
							logger.info("dimming light ["+v+"]");
							var dimmer = delay((configs.accents.transitionTime * 100), hue.lights.state.change(v, {"bri":0,"transitiontime":configs.accents.transitionTime})).then(
								function(){
									actionList.push(hue.lights.turnOff(v));
								}
							).otherwise(function(){
								logger.info("Delayed dimming call failed for light ["+v+"]");
							});
							actionList.push(dimmer);
						// });
					});
				}
			});

		// } // implied else - most likely first run

		
		// then turn on any that are not on in our next profile
		_.each(nextProfileLights, function(lightId){
			
			// Clone the change object to prevent changing the profile setting
			var thisChange = _.clone(change);
			// The bright light needs to cast light into the room, so to ensure
			// this light is going to generate light we want to overwrite the brightness
			if(lightId == briLight){
				thisChange.sat = 50;
			} 

			logger.debug("light ["+lightId+"] profile change ["+JSON.stringify(change)+"] thisChange ["+JSON.stringify(thisChange)+"]");
			actionList.push(methods.turnOnLight(lightId, thisChange, actionList))
		});
		
		logger.info("waiting for ["+actionList.length+"] actions to complete before profile is considered changed");
		return when.all(actionList);
	},
	turnOnLight : function(lightId, change, actionList){
		return hue.lights.state.get(lightId).then(function(rsp){
			if(!rsp.state.on){
				logger.info("turning light [" + lightId + "] on and to dimmest setting");
				var turnOn = hue.lights.state.change(lightId,{"on":true,"bri":0}).then(function(){
					logger.info("light [" + lightId  +"] has started brightening stage");
					var brighten = delay((configs.accents.transitionTime * 100), hue.lights.state.change(lightId,{"bri":configs.accents.bri,"transitiontime":configs.accents.transitionTime})).then(function(){
							hue.lights.state.isOn(lightId).then(function(isOn){
								if(isOn){
									logger.info("light [" + lightId  +"] has started profile change stage");
									hue.lights.state.change(lightId,change);
								} else {
									logger.info("light [" + lightId + "] has been turned off. Accents will assume its off for a reason..")
								}
							});
						}
					);
					
					actionList.push(brighten);
				}).otherwise(function(){
					logger.info("Failed to turn on ligh ["+lightId+"]");
				});;
				actionList.push(turnOn);
			} else {
				logger.info("light ["+lightId+"] is already on, activating profile change");
				actionList.push(hue.lights.state.change(lightId, change));
			}
		});
	},
	getNextProfile : function(){
		if(configs.state.current.profile == 'none'){
			return data.mergedProfiles[0];
		} else {
			// find next in line
			logger.info("looking for next profile. current profile [" + configs.state.current.profile + "]");
			var group = methods.getCurrentProfile();
			// If group wasn't found in available profiles, default to first available
			if(group == undefined){
				return data.mergedProfiles[0];
			} // implied else - we found the current profile in the available profiles
			
			logger.debug("current profile [",group,"]");
			var index = _.indexOf(data.mergedProfiles, group);
			logger.debug("current index [" + index + "]");
			if(index == (data.mergedProfiles.length - 1)){
				index = -1;
				logger.debug("index reset back to first element");
			}
			var nextIndex = ++index;
			logger.debug("next profile has an index of ["+nextIndex+"]");
			return data.mergedProfiles[nextIndex];
		}
	},
	getCurrentProfile : function(){
		return _.find(data.mergedProfiles, function(profile){
			if(profile.group == configs.state.current.profile){
				return profile;
			}
		});
	},
	randomLight : function(lightArray){
		logger.info("lightArray ["+lightArray+"]");
		var rnd = Math.floor(Math.random() * (lightArray.length));
		logger.debug("Random candidate ["+rnd+"]");
		// Accent-bright requires a certian brightness of bulb to make sure the room is
		// still somewhat light
		if(configs.state.current.mode = "accents-bright"){
			hue.lights.state.get(lightArray[rnd]).then(function(state){
				logger.debug("type of [",state.type,"]")
				var validLight = validBrightLights.indexOf(state.type);
				logger.debug("validLight ["+validLight+"]")
				logger.debug("random light choice ["+lightArray[rnd]+"] [" + (validLight > -1 ? "is" : "isn't") + "] a valid light");
				if(validLight > -1){
					return lightArray[rnd];
				} else {
					lightArray.splice(rnd);
					if(lightArray.length){
						return methods.randomLight(lightArray);
					} else {
						return lightArray[rnd];
					}
				}
			});
		}

		return rnd;
	}
};


// Rest API
server.put({path:"/accents/start", version : "1"}, function(req, resp, next){
	logger.info("Request received to start accents mode");
	
	if(configs.state.current.mode != "accents"){
		methods.start();
		resp.status(200);
	} else {
		logger.info("You're already IN accents mode silly..");
	}
	
	return next();
});

module.exports = methods;