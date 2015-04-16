var mongoose = require('mongoose'),
    Light = require('../models/Light');

var room = mongoose.Schema({
  id : String,
  name : String,
  lights : [Light.schema]
});

console.log("+===================",Light)

module.exports = mongoose.model("Room", room);