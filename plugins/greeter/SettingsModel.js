var _ = require("lodash"),
    mongoose = require('mongoose'),
    staticDa = require("./da").statics,
    instanceDa = require("./da").instance;

var configSchema = mongoose.Schema({
      arrival: {
        scene: { type: mongoose.Schema.Types.ObjectId, ref: 'Scene' }
      }
    }),
    configObj;

// Local instance methods
var locals = {
  
};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods    
configSchema.methods = mergedInstance;
// Add Static methods
configSchema.statics = staticDa;

// Create Schema
configObj = mongoose.model("GreeterConfigs", configSchema);

module.exports = configObj;