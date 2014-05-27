var _ = require("underscore");
var when = require("when");
var delay = require("when/delay");
var log4js = require("log4js");

var logger = log4js.getLogger("Accents");

// local deps
var configs = require("./state");
var hue = require("./hue-api");
var server = require("./rest");

var timers = {};

var data = {};

methods = {
	init : function(){
		logger.info("Attempting to startup Accents");

		if(configs.accents.enabled){
			try{
				methods.checkGroups();
			} catch (e){
				logger.error("Exception while attempting to start Accents", e);
			}
		} else {
			logger.info("Accents mode has been disabled");
		}
	},
	checkGroups : function(){
		
		hue.groups.get().then(function(rsp){
			
			// Build a list of unique groups we need
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
			
			// Find which groups we need to add
			data.profileGroups = [];
			_.each(rsp, function(v,k){
				if(_.contains(data.uniqueGroups, v.name)){
					data.profileGroups.push(v.name);
				}
				
				_.find(data.mergedProfiles,function(profile){
					if(v.name == profile.group){
						profile.id = k;
						return true;
					}
				});

			});
			
			_.each(configs.groups, function(v){
				_.find(data.mergedProfiles,function(profile){
					if(v.name == profile.group){
						profile.lights = v.lights;
						return true;
					}
				});
			});
			
			methods.start();
			
		}).otherwise(function(err){
			// TODO: error handling
			logger.info("check groups otherwise: ",err);
		});
	},
	start : function(){
		logger.info("Enabling Accent mode");
		// lock in our mode
		configs.state.current.mode = "accents";	
		
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
	},
	startChange : function(){
		try{
			if(configs.state.current.mode == "accents"){
				// logger.info(state.times);
				var now = new Date();
				if(now < configs.state.times.sunriseEnd || now > configs.state.times.sunsetStart){
					logger.info("Looks like its dark enought for Accents mode. Starting accent cycle.");
					if(configs.state.times.rolloverTime < now){
						main.refreshTimes();
					}
					
					var nextProfile = methods.getNextProfile();
					var currentProfile = accents.getCurrentProfile();

					methods.changeProfile(currentProfile, nextProfile);

				} else {
					
					logger.debug("Not dark enough for accents. Accents will start at ["+configs.state.times.sunsetStart+"]");
				}
			} else {
				logger.info("Invalid state of ["+state.current.mode+"] unable to start accents");
			}
		} catch (e){
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
		if(currentProfile != undefined){
			// first turn off any ligths that are not needed anymore
			logger.info("current light set [" + currentProfile.lights + "] next light set [" + nextProfile.lights + "]");
			var oldLights = _.difference(currentProfile.lights,nextProfile.lights);
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

		} // implied else - most likely first run
		
		// then turn on any that are not on in our next profile
		_.each(nextProfile.lights, function(v){
			var get = hue.lights.state.get(v).then(function(rsp){
				if(!rsp.state.on){
					logger.info("turning light [" + v + "] on and to dimmest setting");
					var turnOn = hue.lights.state.change(v,{"on":true,"bri":0}).then(function(){
						logger.info("light [" + v  +"] has started brightening stage");
						var brighten = delay((configs.accents.transitionTime * 100), hue.lights.state.change(v,{"bri":configs.accents.bri,"transitiontime":configs.accents.transitionTime})).then(function(){
								logger.info("light [" + v  +"] has started profile change stage");
								hue.lights.state.change(v,change);
							}
						);
						
						actionList.push(brighten);
					}).otherwise(function(){
						logger.info("Failed to turn on ligh ["+v+"]");
					});;
					actionList.push(turnOn);
				} else {
					logger.info("light ["+v+"] is already on, activating profile change");
					actionList.push(hue.lights.state.change(v, change));
				}
			});
			actionList.push(get);
		});
		
		logger.info("waiting for ["+actionList.length+"] actions to complete before profile is considered changed");
		return when.all(actionList);
	},
	getNextProfile : function(){
		if(configs.state.current.profile == 'none'){
			return data.mergedProfiles[0];
		} else {
			// find next in line
			logger.info("looking for next profile. current profile [" + configs.state.current.profile + "]");
			var group = accents.getCurrentProfile();
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
	}
};


// Rest API
server.put({path:"/accents/start", version : "1"}, function(req, resp, next){
	logger.info("Request received to start accents mode");
	
	if(configs.state.current.mode != "accents"){
		methods.start();
	} else {
		logger.info("You're already IN accents mode silly..");
	}
	
	return next();
});

module.exports = methods;