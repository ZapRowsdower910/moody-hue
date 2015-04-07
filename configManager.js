var mongo = require("mongodb"),
    mongoose = require("mongoose"),
    when = require("when"),
    log4js = require("log4js");

var bootstrapConfigs = require("./configs"),
    generalSchema = require("./models/generalConfigs");
    log = log4js.getLogger("Main");

var methods = {
  init : function(){
    var dfd = when.defer();

    if(bootstrapConfigs && bootstrapConfigs.mongo &&
      bootstrapConfigs.mongo.ip &&
      bootstrapConfigs.mongo.port)
    {
      log.info("Attempting to connect to mongodb..");
      mongoose.connect("mongodb://" + bootstrapConfigs.mongo.ip + ":" + bootstrapConfigs.mongo.port);

      db = mongoose.connection;
      db.on('error', function(e){
        dfd.reject(e);
      });

      db.once('open', function (callback) {
        log.info("Connected to Mongo!");

        generalSchema.find({}, function(e, confs){
          if(e){
            log.error("Failure getting general configs", e);
            dfd.reject(e);
          }

          var conf;

          if(confs.length < 1){
            // No configurations were found -- we need to setup for the first time
            log.info("No general configs were found in Mongo - if this is not your first time setting up this app please check mongo is working");

            // Create base config obj
            conf = generalSchema({
              server :{
                ip : bootstrapConfigs.server.ip,
                port : bootstrapConfigs.server.port
              }
            });

            log.debug("Default config obj created [%s]", conf);

            // Store in mongo
            conf.save(function(e){
              if(e){
                dfd.reject(e);
              } 

              console.log("General conf created!");
            });

          } else {
            // Get first instance of config
            conf = confs[0];

            if(confs.length > 1){
              log.warn("Found more than 1 general configuration in mongo - using first.");
            }

          }

          dfd.resolve(conf);

        });
      });
    } else {
      dfd.reject("Unable to connect to mongodb - configs don't exist! Check your configs.json file for the mongo object and make sure its properly configured.");
    }

    return dfd.promise;
  }, // Close Init
  getGeneral : function(){
    var dfd = when.defer();

    generalSchema.find({}, function(e, confs){
      if(e){
        log.error("Failure getting general configs", e);
        dfd.reject(e);
      }

      var conf;

      if(confs.length > 0){

        conf = confs[0];

        if(confs.length > 1){
          log.warn("Found more than 1 general configuration in mongo - using first.");
        }

        dfd.resolve(conf);

      } else {
        dfd.reject("Unable to find General Config");
      }

    });

    return dfd.promise;
  }

};

module.exports = methods;