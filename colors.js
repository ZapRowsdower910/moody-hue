var when = require("when"),
	log = require("log4js").getLogger("ColorDa");

var da = require("./da"),
	Color = require("./models/Color"),
	events = require("./eventHelper");


var colorDa = new da("color", Color);	

// var methods = {
// 	getById : function(colorId){
// 		var dfd = when.defer();

// 		Color.findById(colorId, function(e, color){

// 	        if(e){
// 	          log.error("Exception during get color by id [%s]:", colorId, e);
// 	          dfd.reject(e);
// 	        }

// 	        log.info("Found color [%o] ", color);
// 	        if(color){
// 	        	dfd.resolve(color);	
// 	        } else {
// 	        	dfd.reject();	
// 	        }
	        
//       	});

// 		return dfd.promise;
// 	},
// 	getAll : function(){
// 		var dfd = when.defer();

// 		Color.find(function(e, color){

// 	        if(e){
// 	          log.error("Exception during get all colors:",e);
// 	          dfd.reject(e);
// 	        }

// 	        log.info("Found [%s] colors", color.length, color);

// 	        dfd.resolve(color);
//       	});

// 		return dfd.promise;
// 	},
// 	save : function(color){
// 		var dfd = when.defer();

// 		if(color){
// 			// TODO: check type?
// 			color.save(function(e, c){
// 				if(e){
// 		          log.error("Exception during save color:",e);
// 		          dfd.reject(e);
// 		        }

// 		        if(c){
// 		        	dfd.resolve(c);
// 	        	} else {
// 	        		dfd.reject();	
// 	        	}
//         	});

// 		} else {
// 			// TODO: err msg/type? or maybe throw excption?
// 			dfd.reject();
// 		}

// 		return dfd.promise;
// 	},
// 	delete : function(colorId){
//     	var dfd = when.defer();

//     	Color.findOneAndRemove({_id:colorId}, function(e, l){
// 	        if(e){
// 	          log.error("exception while attempting to remove color colorId [%s]", colorId, e);
// 	          dfd.reject(e);
// 	        }

// 	        if(l){
// 	        	log.debug("deleted color using colorId [%s]", colorId);
// 	        	// Publish a delete event
// 	        	events.publish("colors:remove", colorId);

// 	        	dfd.resolve(l);

// 	        } else {
// 	        	log.error("failed to find and delete color using id [%s]", colorId);
// 	        	dfd.reject();
// 	        }

//       	});

//     	return dfd.promise;
//     }
// };

module.exports = colorDa;