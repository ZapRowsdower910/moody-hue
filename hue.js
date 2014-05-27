var needle = require("needle");
var fs = require("fs");
var _ = require("underscore");
var log4js = require("log4js");
log4js.configure({
  appenders: [
    { type: "console" }
  ],
  replaceConsole: true,
  levels : {
	"Rest" : "DEBUG"
  }
});
// Used to deep merge configs
var deepExt = require("underscore-deep-extend");
// Wire deepExtend function
_.mixin({deepExtend: deepExt(_)});
var sun = require("suncalc");
var when = require("when");

// local deps
var hue = require("./hue-api");
var accents = require("./accents");
var configs = require("./state");
var server = require("./rest");
var bedtime = require("./bedtime");
var weather = require("./weather");
var rooms = require("./rooms");

var logger = log4js.getLogger("Main");

main = {
	init : function(){
		try{

			// load configuration file
			fileConfigs = JSON.parse( fs.readFileSync('conf.js', encoding="utf-8"));
		
			var mergedConfigs = _.deepExtend(configs, fileConfigs);
			configs = mergedConfigs;
			//log4js.configure(
			
			// validate configs
			if(configs.accents && configs.accents.enabled == true){
				// TODO: validate timer value
				
				// Transition time must be lower than timer
				var adjustedTime = configs.accents.timer / 100;
				if(adjustedTime < configs.accents.transitionTime){
					configs.accents.transitionTime = adjustedTime - 1000;
					if(configs.accents.transitionTime <= 0){
						configs.accents.transitionTime = 1;
					}
					logger.warn("Accents transition time is configured higher than the accent profile timer. The transiiton timer must be set to a larger value to give the bulbs enough time to complete their color change. Transition time has been adjusted to ["+configs.accents.transitionTime+"]");
					
				}
			}
			
			main.registerApp.checkStatus();
			
			main.refreshTimes();
		} catch(e){
			logger.error("Error attempting to start app", e);
		}
	},
	registerApp : {
		checkStatus : function(){
			logger.info("Checking app authentication status of user ["+configs.general.apiName+"]..");
			hue.api.get("").then(function(resp){

				if(resp.lights){
					logger.info("Successful api call made! We're is good to go");
					
					main.startPlugins();
					
				} else {
					logger.info("cheese and rice!");
					if(resp[0].error.type == 1){
						logger.info("Application has not yet been authenticated with bridge - starting activaction flow");
						main.registerApp.start();
					} else {
						logger.error("Not sure what we have here [",rsp,"]");
					}
				}
			}).otherwise(function(err){
				logger.error("Error while attempting to check app status[",err,"]");
			});
		},
		start: function(){
			if(configs.general.apiName){
				var data = {
					devicetype : "nodejs app",
					username : configs.general.apiName
				};
				needle.post(configs.hue.baseIp + "/api", data, {json : true}, main.registerApp.processResult);
			} else {
				logger.error("Configuration field apiName is empty, please update config to include a valid apiName to register this app under");
			}
		},
		processResult : function(err,resp){
			if(!err){
				// logger.info(resp);
				if(resp.body){
					var rsp = resp.body;
					// logger.info(rsp[0]);
					if(!rsp[0].error){
						logger.info("New API user created successfully");
					} else {
						if(resp.body[0].error.type == 7){
							logger.error("Check your apiName configuration - this fields needs to be between 10-40 characters long.");
							logger.error("Unable to continue, exiting");
						} else if(resp.body[0].error.type == 101){
							logger.info("Ok, you have 30 seconds to click the button on your bridge to authenticate this app before the request expires. If 30 seconds elapses, re-run the program to send another registration request.");
						} else {
							logger.error(resp.body[0]);
						}						
					}
				} else {
					logger.error("invalid response back from api register request. Unable to complete app registeration");
				}
			} else {
				main.requestError(err);
			}
		}
	},
	configureGroups : function(){
		hue.get("/groups", function(rsp){
			var groupCount = 0;
			var completedCount = 0;
			_.each(rsp, function(v,i){
				var group = _.find(configs.groups, function(g){
					if(g.name == v.name){
						groupCount++;
						return g;
					}
				});
				if(group != undefined){
					group.id = i;
					groups.setMembers(group, function(){
						completedCount++;
						logger.info(groupCount, completedCount);
						if(groupCount == completedCount){
							main.startPlugins();
						}
					});
				}
			});
		});
	},
	startPlugins : function(){
		logger.info("Boot sequence completed. Starting up plugins");
		try{

			// weather.show.current();
			
			accents.init();

		} catch (e){
			logger.error("Error while starting up plugins: ", e);
		}
	},
	refreshTimes : function(){
		var now = new Date();
		configs.state.times = sun.getTimes(now, configs.general.latitude, configs.general.longitude);
		configs.state.times.rolloverTime = new Date(now.getFullYear(), now.getMonth(), (now.getDate() + 1), 0, 0, 0, 0);
	
//		logger.info(configs.state.times);
	},
	updateMode : function(newState){
		configs.state.current.mode
	}
};
// Startup processing core
main.init();
