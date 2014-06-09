var when = require("when");
var _ = require("underscore");
var Forecast = require("forecast");

// lcocal deps
var configs = require("../state");
var server = require("../rest");
var hue = require("../hue-api");

var instance;
var timers = {};


var api = {
	actions : {
		init : function(){
	
			instance = new Forecast({
				service : "forecast.io",
				key : "df4d170ea01fc3a0cb9ab53d8cefd8b5",
				units : "ferinheight",
				cache : true,
				ttl: {           
				// How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
				  minutes: 30
				}
			});
		}
	},
	get : function(){
		// make sure we have built an instance..
		if(instance == undefined){
			api.init();
		}
		
		var dfd = when.defer();
		
		instance.get([configs.general.latitude, configs.general.longitude], function(err, weather){
			if(err){
				// TODO: handle error?
				console.log("error while attempting to get the weather:", err);
				dfd.reject(err);
			} else {
				dfd.resolve(weather);
			}
		});
		
		return dfd.promise;
	},
	show : {
		week : function(where){
			api.get().then(function(weather){
				console.log("the weather: ", weather.daily.icon);
				// _.each(weather.daily.data, function(v, i){
					// console.log(v);
				// });
				api.displayWeather(weather.daily,where);
				
			}).otherwise(function(err){
				console.log("no baweno", err);
			});
		},
		tomorrow : function(where){
			api.get().then(function(weather){
				console.log("the weather: ", weather.daily.data[0].icon);
				
				api.displayWeather(weather.daily.data[0],where);
				// api.displayWeather("rain",where);
				
			}).otherwise(function(err){
				console.log("no baweno", err);
			});
		},
		current : function(where){
			api.get().then(function(weather){
				console.log("the weather: ", weather.currently.icon);
			
				api.displayWeather(weather.currently,where);
				
			}).otherwise(function(err){
				console.log("no baweno", err);
			});
		},
	},
	displayWeather : function(conditions,where){
		var current = conditions.icon;
		// var current = "rain";
		var newProfile = _.find(configs.weather.profiles, function(v){
			return v.type == current;
		});
		
		if(timers.weatherGroup){
			clearInterval(timers.weatherGroup);
			console.log("previous running weather state cleared");
		}
		
		if(newProfile){
			
			if(current == "rain" || current == "snow"){
			
				api.makeItRain(conditions,newProfile,where);

			} else if(_.isArray(newProfile.color)){
				api.cycleConditions(newProfile.color,where);
			} else {
				api.syncLightsToWeather(newProfile.color,where);
			}
			
		} else {
			console.log("No profile for current weather of [" + current + "]");
		}
	},
	syncLightsToWeather : function(change,where){
		// Get default configure weather lights
		var lights = configs.weather.lights;
		// Check for api override light set
		if(where != undefined && (_.isArray(where) && where.length)){
			lights = where;
		}
		// loop thru lights and set weather state
		_.each(lights, function(light){
			hue.lights.state.isOn(light).then(function(rsp){
				if(!rsp){
					change.on = true;
				}
				console.log("Changing light ["+light+"] to display weather conditions");
				hue.lights.state.change(light, change);
			});
		});
	},
	cycleConditions : function(settings,where,speedOverride){
		var speed = speedOverride || configs.weather.cycleTime;
		console.log("speed of current condition cycle: ",speed, where);
		var cycleCount = 0;
		timers.weatherGroup = setInterval(function(){
			_.each(settings, function(v,i){

				if(i > 0){
					setTimeout(function(){
						api.syncLightsToWeather(v,where);
					},
					(speed / 2));
				} else {
					api.syncLightsToWeather(v,where);
				}
			});

			if(cycleCount >= configs.weather.cycleLimit){
				clearInterval(timers.weatherGroup);
				timers.weatherGroup = false;
			}
			
			cycleCount++;
		},
		speed);
	},
	makeItRain : function(conditions, profile, where){
		var intensity = conditions.precipIntensity || conditions.precipIntensityMax;
		// var intensity = .00039;

		// find our intensity configs
		var thresholdGroup = _.find(configs.weather.precipThresholds, function(v,i){
			return (intensity <= v.threshold || (i +1) == configs.weather.precipThresholds.length);
		});
		
		console.log("current rain is ["+intensity+"] which falls into [",thresholdGroup,"]");
		
		var changes = [];
		
		// Set the bright state
		var high = _.clone(profile.color);
		high.bri = 250;
		high.transitiontime = Math.floor(((thresholdGroup.cycleTime / 100) / 2));
		changes.push(high);
		// Set the low state
		var low = _.clone(profile.color);
		low.bri = 125;
		low.transitiontime = Math.floor(((thresholdGroup.cycleTime / 100) / 2));
		changes.push(low);
		
		console.log("Setting percipitation changes as: ", changes);
		api.cycleConditions(changes,where,thresholdGroup.cycleTime);
	},
	web : {
		show : function(showWhen, id){
			console.log(arguments);
			try{
				idArray = undefined;
				if(id){
					idArray = new Array();
					idArray.push(id);
				}
				
				console.log("weather request for ["+showWhen+"] ids ["+idArray+"]");
				
				if(showWhen == "current"){
					api.show.current(idArray);
				} else if(showWhen == "tomorrow"){
					api.show.tomorrow(idArray);
				} else if(showWhen == "week"){
					api.show.week(idArray);
				} else {
					console.log("Unknown value ["+showWhen+"], I'm not sure what to display for you..");
					resp.json(500);
				}
			} catch(e){
				console.error("Error while attempting to show weather: ", e);
			}
		}
	}
};

server.get({path : '/weather/show/:when', version : '1'}, function(req, resp, next){
	console.log("request received on /weather/show/:when");
	
	var showWhen = req.params.when;
	api.web.show(showWhen);
	
	return next();
});

server.get({path : '/weather/show/:when/:id', version : '1'}, function(req, resp, next){
	console.log("request received on /weather/show/:when/:id");
	
	var showWhen = req.params.when;
	var id = req.params.id
	api.web.show(showWhen, id);
	
	return next();
});

module.exports = api;