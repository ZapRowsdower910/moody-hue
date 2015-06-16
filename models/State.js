var mongoose = require('mongoose');

var lite = mongoose.Schema({
  name : String,
  transition : {type: Number, min : 0},
  bri: {type: Number, min : 0, max: 255},
  color : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }]
});

module.exports = mongoose.model("State", lite);