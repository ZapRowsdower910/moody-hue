var _ = require("underscore");
var fs = require("fs");
var when = require("when");
var log4js = require("log4js");
var logger = log4js.getLogger("Plugin Manager");

var methods = {
	init : function(){
		logger.info("Initializing Plugin Manager");
		methods.getDir("plugins").then(function(files){
			logger.info("files currently in folder ["+files+"]");
			_.each(files, function(file){
				var parts = file.split(".");
				if(parts.length > 1 && parts[1] == "js"){
					methods.loadPlugin(file);
				}
			});
		});
	},
	getDir : function(path){
		var dfd = when.defer();
		fs.readdir(path, function(err, files){
			if(!err){
				dfd.resolve(files);
			} else {
				dfd.reject(err);
			}
		});

		return dfd.promise;
	},
	loadPlugin : function(file){
		if(!file){
			throw "Invalid file";
		}
		var path = "./plugins/" + file;
		logger.debug("Attempting to load plugin file ["+path+"]");
		var plugin = require(path);

		if(plugin){
			try{
				plugin.actions.init();
			} catch(e){
				logger.debug("Failed to fire init event on plugin ["+file+"] due to ["+e+"]");
			}	
		} else {
			logger.warn("Plugin ["+file+"] did not export any functions. Unknown if properly loaded.");
		}
		
	}
};

module.exports = methods;