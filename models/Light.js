var mongoose = require('mongoose');

var lite = mongoose.Schema({
  name : String,
  type : String
});

module.exports = mongoose.model("Light", lite);