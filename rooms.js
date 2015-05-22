var when = require("when"),
	log = require("log4js").getLogger("Rooms");

var Room = require("./models/Room"),
	Light = require("./models/Light"),
	events = require("./eventHelper");

methods = {
	getById: function(roomId){
		var dfd = when.defer();

		Room.findById(roomId)
		.populate("lights")
	    .exec(function(e, room){
			if(e){
				log.error("encountered exception while attempting to get room [%s] from mongo:", roomId, e);
				dfd.reject(e);
			}

			if(room){
				dfd.resolve(room);	
			} else {
				dfd.reject();
			}
			

		});

		return dfd.promise;
	},
	getAll: function(){
		var dfd = when.defer();

		Room.find()
		.populate("lights")
	    .exec(function(e, rooms){

			if(e){
				log.error("encountered exception while attempting to get all rooms from mongo:", e);
				dfd.reject(e);
			}

			log.info("Found rooms [%s]", rooms.length);

			dfd.resolve(rooms);
		});

		return dfd.promise;
	},
	save : function(room){
		var dfd = when.defer();

		// TODO: instance check to make sure we're dealing w/ a Room
		// schema obj
		if(room){

			room.save(function(e, rm){
	            if(e){
	              log.error("error while attempting to save room:", r);
	              dfd.reject(e);
	            }

	            console.log(rm);

	            if(rm){
	            	dfd.resolve(rm);
	            } else {
	            	dfd.reject();
	            }
	        });
		} // TODO: do we need err handling?

		return dfd.promise;
	},
	delete : function(roomId){
    	var dfd = when.defer();

    	Room.findOneAndRemove({_id:roomId}, function(e, l){
	        if(e){
	          log.error("exception while attempting to remove room roomId [%s]", roomId, e);
	          dfd.reject(e);
	        }

	        if(l){
	        	log.debug("deleted room using roomId [%s]", roomId);
	        	// Publish a delete event
	        	events.publish("rooms:remove", roomId);

	        	dfd.resolve(l);

	        } else {
	        	log.error("failed to find and delete room using id [%s]", roomId);
	        	dfd.reject();
	        }

      	});

      	return dfd.promise;
    }
};

// TODO: add a cleanup event that listens for a light being deleted
// (thru an event listener) then removes the lightId from any room
// that currently has that under lights. Currently id's are being 
// orphaned in the lights[].

module.exports = methods;