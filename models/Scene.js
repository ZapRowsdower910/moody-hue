var mongoose = require('mongoose');

var lite = mongoose.Schema({
  name : String,
  rooms : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  groups : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  state : { type: mongoose.Schema.Types.ObjectId, ref: 'State' }
});

module.exports = mongoose.model("Scene", lite);