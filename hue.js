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

			// load configuration file
			fileConfigs = JSON.parse( fs.readFileSync('conf.js', encoding="utf-8"));
		
			var mergedConfigs = _.deepExtend(configs, fileConfigs);
			configs = mergedConfigs;

 			// Start rest server
			// server.listen(configs.server.port, configs.server.ip_addr, function(){
				// logger.info("====================================================");
				// logger.info("=========== [ Starting up REST service ] ===========");
			    // logger.info("=========== [ App %s           ] ===========", server.name);
				// logger.info("=========== [ listening at %s ] ======", server.url );
				// logger.info("====================================================");
			// });

			// Setup session objects
			configs.state = {};
			configs.state.timers = {};
			configs.state.current = {};
			configs.state.current.mode = "startup";
			configs.state.current.isSetup = false;
			configs.state.current.isScanningForBase = false;

			// main.checkStatus();
			main.startPlugins();
			main.refreshTimes();
		} catch(e){
			logger.error("Error attempting to start app", e);
		}
	},
	checkStatus : function(){
		logger.info("Checking app authentication status of user ["+configs.general.apiName+"]..");
		
		// Attempt to make an api call using the configured app name
		hue.api.get("").then(function(resp){

			if(resp.lights){
				logger.info("Successful api call made! We're is good to go");
			} else {
				logger.warn("Oh cheese and rice! Something isn't right..");
				if(resp[0].error.type == 1){
					logger.info("Application has not yet been authenticated with bridge - starting activaction flow");
					hue.api.registerUser().then(function(){
						logger.info("API User all setup");
					},
					function(err){
						logger.error("unable to complete app registration with the hue base server [",err,"]");
					});
				} else {
					logger.error("Not sure what we have here [",rsp,"]");
				}
			}
		}).otherwise(function(err){
			logger.error("Error while attempting to check app status[",err,"]");
		});
	},
	// registerApp : {
		
		// start: function(){
			// if(configs.general.apiName){
				// var data = {
					// devicetype : "moody-hues nodejs app",
					// username : configs.general.apiName
				// };
				// needle.post(configs.hue.baseIp + "/api", data, {json : true}, main.registerApp.processResult);
			// } else {
				// logger.error("Configuration field apiName is empty, please update config to include a valid apiName to register this app under");
			// }
		// },
		// processResult : function(err,resp){
			// if(!err){
				// // logger.info(resp);
				// if(resp.body){
					// var rsp = resp.body;
					// // logger.info(rsp[0]);
					// if(!rsp[0].error){
						// logger.info("New API user created successfully");
					// } else {
						// if(resp.body[0].error.type == 7){
							// logger.error("Check your apiName configuration - this fields needs to be between 10-40 characters long.");
							// logger.error("Unable to continue, exiting");
						// } else if(resp.body[0].error.type == 101){
							// logger.info("Ok, you have 30 seconds to click the button on your bridge to authenticate this app before the request expires. If 30 seconds elapses, re-run the program to send another registration request.");
						// } else {
							// logger.error(resp.body[0]);
						// }						
					// }
				// } else {
					// logger.error("invalid response back from api register request. Unable to complete app registeration");
				// }
			// } else {
				// main.requestError(err);
			// }
		// }
	// },
	startPlugins : function(){
		logger.info("Boot sequence completed. Starting up plugins");
		try{
			
			pluginManager.init();

		} catch (e){
			logger.error("Error while starting up plugins: ", e);
		}
	},
	refreshTimes : function(){
		var now = new Date();
		configs.state.times = sun.getTimes(now, configs.general.latitude, configs.general.longitude);
		configs.state.times.rolloverTime = new Date(now.getFullYear(), now.getMonth(), (now.getDate() + 1), 0, 0, 0, 0);
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
