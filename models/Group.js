var _ = require("lodash"),
		mongoose = require('mongoose'),
    staticDa = require("./da").statics,
    instanceDa = require("./da").instance;

var groupSchema = mongoose.Schema({
	  id : String,
	  name : String,
	  lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }]
	}),
	groupObj;

// Local instance methods
var locals = {

};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods    
groupSchema.methods = mergedInstance;
// Add Static methods
groupSchema.statics = staticDa;

// Create Schema
groupObj = mongoose.model("Group", groupSchema);

module.exports = groupObj;