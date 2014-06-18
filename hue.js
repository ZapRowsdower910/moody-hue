var needle = require("needle");
var fs = require("fs");
var _ = require("underscore");
var log4js = require("log4js");

// Used to deep merge configs
var deepExt = require("underscore-deep-extend");
// Wire deepExtend function
_.mixin({deepExtend: deepExt(_)});
var sun = require("suncalc");
var when = require("when");

// local deps
var hue = require("./hue-api");
var configs = require("./state");
var server = require("./rest");
var pluginManager = require("./pluginManager");

// console.log(configs.general.logging.fileAppender);
// log4js.configure({
//   appenders: [
//     { type: "console" },
//     configs.general.logging.fileAppender
//   ],
//   replaceConsole: true,
//   levels : {
// 	"Rest" : "DEBUG"
//   }
// });

log4js.configure({
  appenders: [
    { type: "console" },
    {
    	"type": "file",
        "filename": "logs/log.file",
        "maxLogSize": 20480,
        "backups": 3
    }
  ],
  replaceConsole: true,
  levels : {
	"Rest" : "DEBUG"
  }
});

var logger = log4js.getLogger("Main");

main = {
	init : function(){
		try{
			logger.info("Starting up moody-hues");

			// load configuration file
			fileConfigs = JSON.parse( fs.readFileSync('conf.js', encoding="utf-8"));
		
			var mergedConfigs = _.deepExtend(configs, fileConfigs);
			configs = mergedConfigs;

 			// Start rest server
			server.listen(configs.server.port, configs.server.ip_addr, function(){
				logger.info("====================================================");
				logger.info("=========== [ Starting up REST service ] ===========");
			    logger.info("=========== [ App %s           ] ===========", server.name);
				logger.info("=========== [ listening at %s ] ======", server.url );
				logger.info("====================================================");
			});

			// Setup session objects
			configs.state = {};
			configs.state.timers = {};
			configs.state.current = {
				mode : "startup",
				isSetup : false,
				isScanningForBase : false,
				timers : {}
			};

			main.checkStatus();
			// main.startPlugins();
			// Get intial boot times
			main.times.refresh();
			// setup a watcher to refresh the times daily
			main.times.watcher.start();
		} catch(e){
			logger.error("Error attempting to start app", e);
		}
	},
	checkStatus : function(){
		logger.info("Checking app authentication status of user ["+configs.general.apiName+"]..");
		
		// Attempt to make an api call using the configured app name
		var prms = hue.api.get("").then(function(resp){
			var dfd = when.defer();

			if(resp.lights){
				logger.info("Successful api call made! We're is good to go");
				dfd.resolve();
			} else {
				logger.warn("Oh cheese and rice! Something isn't right..");
				if(resp[0].error.type == 1){
					logger.info("Application has not yet been authenticated with bridge - starting activaction flow");
					hue.api.registerUser().then(function(){
						logger.info("API User all setup");
						dfd.resolve();
					},
					function(err){
						dfd.reject("unable to complete app registration with the hue base server [",err,"]");
					});
				} else {
					dfd.reject("Not sure what we have here [",rsp,"]");
				}
			}

			return dfd.promise;
		}, function(err){
			logger.error("Error while attempting to check app status[",err,"]");
		});

		prms.then(
			main.startPlugins, 
			function(err){
				logger.error(err);
			}
		);
	},
	startPlugins : function(){
		logger.info("Boot sequence completed. Starting up plugins");
		try{
			
			pluginManager.init();

		} catch (e){
			logger.error("Error while starting up plugins: ", e);
		}
	},
	times : {
		refresh : function(){
			var now = new Date();
			configs.state.times = sun.getTimes(now, configs.general.latitude, configs.general.longitude);
		},
		watcher : {
			start : function(){
				// When a watcher is started most likely it will not be at midnight. So we need to detect the time until
				// midnight and wait for that amount of time to reset the time values. After that first time we can simply
				// refresh the times every 24hrs.
				var now = new Date();
				var tomorrow = new Date(now.getFullYear(), now.getMonth(), (now.getDate() + 1), 0, 0, 0, 0);
				var timeToWait = tomorrow - now;
				logger.info("Scheduling time refresh in ["+timeToWait+"]");
				configs.state.current.timers.timeRefresh = setTimeout(function(){
					// reset times
					main.times.watcher.interval();
					// make sure the timer var is cleared so we can reuse it
					clearTimeout(configs.state.current.timers.timeRefresh);
					// setup an interval event to allow for refreshing every 24hrs
					configs.state.current.timers.timeRefresh = setInterval(
						main.times.watcher.interval,
						utils.converter.hrsToMilli(24)
					);
					
				},
				timeToWait);
			},
			stop : function(){
				clearTimeout(configs.state.current.timers.timesRefresh);
			},
			interval : function(){
				var now = new Date();
				if(configs.state.times.rolloverTime < now){
					main.refreshTimes();
				}
			}
		}
	},
	isDarkOut : function(){
		var now = new Date();
		if(now < configs.state.times.sunriseEnd){
			return true;
		}

		return false;
	}
};
// Startup processing core
main.init();
