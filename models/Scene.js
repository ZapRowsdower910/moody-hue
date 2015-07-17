var _ = require("lodash"),
		mongoose = require('mongoose'),
    staticDa = require("./da").statics,
    instanceDa = require("./da").instance;

var sceneSchema = mongoose.Schema({
      name : String,
      lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }],
      state : { type: mongoose.Schema.Types.ObjectId, ref: 'State' }
    }),
    sceneObj;

// Local instance methods
var locals = {

};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods    
sceneSchema.methods = mergedInstance;
// Add Static methods
sceneSchema.statics = staticDa;

// Create Schema
sceneObj = mongoose.model("Scene", sceneSchema);

module.exports = sceneObj;