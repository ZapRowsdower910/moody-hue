var mongoose = require('mongoose');

var scene = mongoose.Schema({
  name : String,
  lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }],
  state : { type: mongoose.Schema.Types.ObjectId, ref: 'State' }
});

module.exports = mongoose.model("Scene", scene);