var when = require("when"),
	log = require("log4js").getLogger("Lights");

var Light = require("./models/Light"),
	events = require("./eventHelper");

 var methods = {
    getById : function(lightId){
    	var dfd = when.defer();

    	Light.findById(lightId, function(e, l){
	        if(e){
          		log.error("exception while attempting to find light lightId [%s]", lightId, e);
	          	dfd.reject(e);
	        }

	        if(l){
	          	log.debug("Found light [%s] using lightId [%s]", l, lightId);

	          	dfd.resolve(l);
	        } else {
	        	log.error("No lights found using id [%s]", lightId);
    			dfd.reject("No found lights");
	        }
      	});

    	return dfd.promise;
    },
    getAll : function(){
      var dfd = when.defer();

      Light.find(function(e, lights){

        if(e){
          log.error("Exception during get all lights:",e);
          dfd.reject(e);
        }

        log.info("Found [%s] lights", lights.length, lights);

        dfd.resolve(lights);
      });

      return dfd.promise;
    },
    save : function(light){
    	var dfd = when.defer();

    	light.save(function(e, l){
		 	if(e){
	          log.error("error while attempting to save light:",light,e);
	          dfd.reject(e);
	        }

    		if(l){
    			log.debug("Light [%s] saved successfully", light._id);
    			dfd.resolve(l);
    		} else {
    			log.error("Failed to save light [%s]", light._id);
    			dfd.reject();
    		}

    	});

    	return dfd.promise;
    },
    removeLight : function(lightId){
    	var dfd = when.defer();

    	Light.findOneAndRemove({_id:lightId}, function(e, l){
	        if(e){
	          log.error("exception while attempting to remove light lightId [%s]", lightId, e);
	          dfd.reject(e);
	        }

	        if(l){
	        	log.debug("deleted light using lightId [%s]", lightId);
	        	// Publish a delete event
	        	events.publish("lights:remove", lightId);

	        	dfd.resolve(l);

	        } else {
	        	log.error("failed to delete light using id [%s]", lightId);
	        	dfd.reject();
	        }

      	});

      	return dfd.promise;
    }
};

module.exports = methods;