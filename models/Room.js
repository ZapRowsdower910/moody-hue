var _ = require("lodash"),
		mongoose = require('mongoose'),
    Light = require('../models/Light'),
    staticDa = require("./da").statics,
    instanceDa = require("./da").instance;

var roomScema = mongoose.Schema({
      id : String,
      name : String,
      lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }]
    }),
    roomObj;

// Local instance methods
var locals = {

};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods    
roomScema.methods = mergedInstance;
// Add Static methods
roomScema.statics = staticDa;

// Create Schema
roomObj = mongoose.model("Room", roomScema);

module.exports = roomObj

