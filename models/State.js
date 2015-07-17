var _ = require("lodash"),
	mongoose = require('mongoose'),
  staticDa = require("./da").statics,
  instanceDa = require("./da").instance;

var stateSchema = mongoose.Schema({
      name : String,
      transition : {type: Number, min : 0},
      bri: {type: Number, min : 0, max: 255},
      color : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }]
    }),
    stateObj;

// Local instance methods
var locals = {

};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods    
stateSchema.methods = mergedInstance;
// Add Static methods
stateSchema.statics = staticDa;

// Create Schema
stateObj = mongoose.model("State", stateSchema);

module.exports = stateObj;