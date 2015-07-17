var _ = require("lodash"),
		mongoose = require('mongoose'),
		staticDa = require("./da").statics,
    instanceDa = require("./da").instance;

var colorSchema = mongoose.Schema({
      name : String,
      r : { type: Number, min: 0, max: 255 },
      g : { type: Number, min: 0, max: 255 },
      b : { type: Number, min: 0, max: 255 }
    }),
		colorObj;

// Local instance methods
var locals = {

};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods    
colorSchema.methods = mergedInstance;
// Add Static methods
colorSchema.statics = staticDa;

// Create Schema
colorObj = mongoose.model("Color", colorSchema);

module.exports = colorObj;