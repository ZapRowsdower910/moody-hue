var mongoose = require('mongoose'),
    Light = require('../models/Light'),
    da = require("./da");

var roomScema = mongoose.Schema({
      id : String,
      name : String,
      lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }]
    }),
    roomObj = mongoose.model("Room", roomScema),
    roomDa = new da("room", roomObj, ["lights"]);

roomObj.methods = roomDa;

module.exports = roomObj

