var mongoose = require('mongoose');

var room = mongoose.Schema({
  id : String,
  name : String,
  lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }]
});

module.exports = mongoose.model("Group", room);