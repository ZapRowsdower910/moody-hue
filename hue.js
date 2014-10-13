var needle = require("needle"),
	fs = require("fs"),
	_ = require("underscore"),
	log4js = require("log4js"),
	sun = require("suncalc"),
	when = require("when"),
	moment = require("moment");

// local deps
var hue = require("./hue-api"),
	configManager = require("./configManager")
	session = require("./session"),
	pluginManager = require("./pluginManager"),
	utils = require("./utils"),
	express = require('./express'),
	rooms = require("./rooms");

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
      "filename": "logs/log.file"
    }
  ],
  replaceConsole: true
});

var logger = log4js.getLogger("Main");
var configs;

main = {
	init : function(){
		try{
			logger.info("Starting up moody-hues");

			// Load config file, then bootstrap application
			configManager.load().then(
				function(conf){
					configs = conf;

					// Save conf at regular time frames if conf
					// has been modified
					configManager.scheduler.start();

					// Wire up configs
					hue.init(configs);
					express.hueInit(configs);
					utils.init(configs);
					rooms.init(configs);
					session.init(configs);

					// Setup session objects
					session.state.timers = {};
					session.state.current = {
						mode : "startup",
						isSetup : false,
						isScanningForBase : false
					};

					// Check to see if app is registered on hue base
					// server - then startup plugins
					main.checkStatus();

					// Get intial boot times
					main.times.refresh();
					// setup a watcher to refresh the times daily
					main.times.watcher.start();
				},
				function(msg, err){
					logger.error("Unable to start application", msg, err );
				}
			);

			
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
			
			pluginManager.init(configs);

		} catch (e){
			logger.error("Error while starting up plugins: ", e);
		}
	},
	times : {
		refresh : function(){
			var now = new Date();
			now.setHours("12")
			logger.info("Setting up times using lat [%s], long [%s] current date [%s]",configs.general.latitude, configs.general.longitude, now);
			session.state.times = sun.getTimes(now, configs.general.latitude, configs.general.longitude);
			logger.debug("Time refresh complete. New times: ", session.state.times);
		},
		watcher : {
			start : function(){
				// When a watcher is started most likely it will not be at midnight. So we need to detect the time until
				// midnight and wait for that amount of time to reset the time values. After that first time we can simply
				// refresh the times every 24hrs.

				var tomorrow = new moment().add(1,"days").startOf("day").add(10, "minutes"),
						now = new moment(),
						timeToWait = tomorrow.diff(now);

				session.state.times.rolloverTime = new moment.duration(24, "hours");

				logger.info("Scheduling time refresh in ["+utils.converter.milliToHrs(timeToWait)+"] hrs");
				session.state.timers.timeRefresh = setTimeout(function(){
					// reset times
					main.times.refresh();
					logger.info("First day cycle completed, scheduling regular cycle");
					// make sure the timer var is cleared so we can reuse it
					clearTimeout(session.state.timers.timeRefresh);
					// setup an interval event to allow for refreshing every 24hrs
					session.state.timers.timeRefresh = setInterval(
						main.times.refresh,
						utils.converter.hrsToMilli(24)
					);
					
				},
				timeToWait);
			},
			stop : function(){
				logger.info("Stopping suncalc time refresher")
				clearTimeout(session.state.timers.timesRefresh);
			}
		}
	}
};
// Startup processing core
main.init();
