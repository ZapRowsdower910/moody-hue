var fs = require("fs"),
	when = require("when"),
	log4js = require("log4js"),
	logger = log4js.getLogger("Config Manager");;

var configs = {},
	local = {};

var methods = {
	save : function(conf){
		var dfd = when.defer();

		logger.debug("Attempting to save configs to file");
		var jsonStr = JSON.stringify(conf);
		fs.writeFile("state.js", jsonStr,
			function(err, data){
				try{
					if(err){
						dfd.reject(err);
					} else {
						logger.info("Saving configuration file");
						dfd.resolve();	
					}
					
				} catch(e){
					dfd.reject(e);
				}
			}
		);

		return dfd.promise;
	},
	load : function(){
		var dfd = when.defer();

		var currentFile = fs.readFile("state.js","utf-8", function(err, data){
			try{
				if(err){
					dfd.reject(err);
				}else {
					logger.debug("Config file successfully loaded");
					configs = data;
					dfd.resolve(JSON.parse(data));
				}
			} catch(e){
				logger.error("Exception encounter while attempting to load config file", err);
				dfd.reject(err);
			}
		})

		return dfd.promise;
	},
	scheduler : {
		save : function(conf){
			configs = conf;
			local.isScheduled = true;
			logger.info("Scheduling save for next cycle");
		},
		start : function(){
			if(local.schedulerTimer == undefined){
				logger.info("Starting up save scheduler");
				local.scheduleTimer = setInterval(methods.scheduler.cycle,
			 									utils.converter.minToMilli(1));	
			} else {
				logger.info("Scheduler is already started, scheduling save for next cycle");
				methods.scheduler.save(configs);
			}
		},
		stop: function(){
			logger.info("Stopping save scheduler..");
			clearInterval(local.schedulerTimer);
		},
		cycle : function(){
			if(local.isScheduled){
				logger.info("Save cycle starting..");
				methods.save(configs).then(function(){
					local.isScheduled = false;	
				});
			} else {
				logger.debug("No requests to store conf");
			}

		}
	}
};

module.exports = methods;