var mongoose = require('mongoose');

var lite = mongoose.Schema({
  id : String,
  name : String,
  type : String
});

module.exports = mongoose.model("Light", lite);