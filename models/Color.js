var mongoose = require('mongoose');

var color = mongoose.Schema({
  name : String,
  r : { type: Number, min: 0, max: 255 },
  g : { type: Number, min: 0, max: 255 },
  b : { type: Number, min: 0, max: 255 }
});

module.exports = mongoose.model("Color", color);