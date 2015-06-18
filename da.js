/**
*	Generic DA that can be implemented to add basic CRUD functionality
*	to anything needed to be stored in Mongo
**/

var when = require("when"),
	log = require("log4js").getLogger("BaseDa"),
	_ = require("underscore");

// var modelObject = {};

var da = function(name, obj, relatedObjects){
	this.name = name;
	this.modelObject = obj;
	this.related = relatedObjects;
};

da.prototype = {
	getById: function(id){
		var dfd = when.defer(),
			scope = this;

		var query = scope.modelObject.findById(id)
		if(this.related && this.related.length){
			_.each(this.related, function(r){
				query.populate(r);
			});
		}
	    query.exec(function(e, rtnObj){
			if(e){
				log.error("encountered exception while attempting to get %s [%s] from mongo:", scope.name, id, e);
				dfd.reject(e);
			}

			if(rtnObj){
				dfd.resolve(rtnObj);	
			} else {
				dfd.reject();
			}
			

		});

		return dfd.promise;
	},
	getAll: function(){
		var dfd = when.defer(),
			scope = this;

		var query = scope.modelObject.find()
		if(this.related && this.related.length){
			_.each(this.related, function(r){
				// query.populate(r);
			});
		}
	    query.exec(function(e, rtnObj){
	    	
			if(e){
				log.error("encountered exception while attempting to get all [%s] from mongo:",scope.name, e);
				dfd.reject(e);
			}

			log.info("Found [%s] %ss", rtnObj.length, scope.name);

			dfd.resolve(rtnObj);
		});

		return dfd.promise;
	},
	save : function(reqObj){
		var dfd = when.defer(),
		scope = this;

		// TODO: instance check to make sure we're dealing w/ a Scene
		// schema obj
		if(reqObj){

			reqObj.save(function(e, obj){
	            if(e){
	              log.error("error while attempting to save a [%s]:", scope.name, e);
	              dfd.reject(e);
	            }

	            console.log(obj);

	            if(obj){
	            	dfd.resolve(obj);
	            } else {
	            	dfd.reject();
	            }
	        });
		} // TODO: do we need err handling?

		return dfd.promise;
	},
	delete : function(id){
    	var dfd = when.defer(),
    		scope = this;

    	scope.modelObject.findOneAndRemove({_id:id}, function(e, l){
	        if(e){
	          log.error("exception while attempting to remove scene %s Id [%s]", scope.name, id, e);
	          dfd.reject(e);
	        }

	        if(l){
	        	log.debug("deleted scene using %s Id [%s]", scope.name, id);
	        	// Publish a delete event
	        	events.publish("scenes:remove", id);

	        	dfd.resolve(l);

	        } else {
	        	log.error("failed to find and delete %s using id [%s]", scope.name, id);
	        	dfd.reject();
	        }

      	});

      	return dfd.promise;
    }
};

var utils = {
	populateRelated: function(obj, query){
		console.log(obj)
		// if(obj){
			if(obj.related && obj.related.length){
				_.each(obj.related, function(r){
					console.log(r)
					query.populate(r.name);
					utils.populateRelated(r, query);
				});
			} 

			
		// }
		
	}
}

// TODO: add a cleanup event that listens for a light being deleted
// (thru an event listener) then removes the lightId from any scene
// that currently has that under lights. Currently id's are being 
// orphaned in the lights[].

module.exports = da;