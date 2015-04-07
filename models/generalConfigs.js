var mongoose = require('mongoose');

var gen = mongoose.Schema({
  server : {
    ip : String,
    port : Number
  },
  location : {
    latitude: Number,
    longitude: Number  
  }
});

module.exports = mongoose.model("GeneralConfigs", gen);

