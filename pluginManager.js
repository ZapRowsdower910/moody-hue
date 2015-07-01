var _ = require("underscore"),
  fs = require("fs"),
  when = require("when"),
  log4js = require("log4js"),
  log = log4js.getLogger("Plugin Manager"),
  configs;

var methods = {
  plugins:{
    handlers:{
      lights:[]
    }
  },
  init : function(){
    log.info("Initializing Plugin Manager");

    methods.getDir("plugins").then(function(files){

      log.info("files currently in folder ["+files+"]");
      _.each(files, function(file){

        var parts = file.split(".");
        if(parts.length > 1 && parts[1] == "js"){
          methods.loadPlugin(file);
        }

      });

      // log.info("effects found [%s] services found [%s]", session.state.plugins.effects.length, session.state.plugins.services.length)
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
    log.debug("Attempting to load plugin file ["+path+"]");
    var plugin = require(path),
        pluginSettings;

    if(plugin){
      try{

        // Init plugin
        plugin.init(methods.plugins);

        // if(plugin.configs.type == "effect"){
        //   session.state.plugins.effects.push(plugin);
        // } else if (plugin.configs.type == "service"){
        //   session.state.plugins.services.push(plugin);
        // }

      } catch(e){
        log.debug("Failed to fire init event on plugin ["+file+"] due to ["+e+"]");
      } 
    } else {
      log.warn("Plugin ["+file+"] did not export any functions. Unknown if properly loaded.");
    }
    
  }
};

module.exports = methods;