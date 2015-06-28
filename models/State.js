var mongoose = require('mongoose'),
    da = require("./da");

var stateSchema = mongoose.Schema({
      name : String,
      transition : {type: Number, min : 0},
      bri: {type: Number, min : 0, max: 255},
      color : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }]
    }),
    stateObj = mongoose.model("State", stateSchema);
    stateDa = new da("state", stateObj, ["color"]);

stateObj.methods = stateDa;

module.exports = stateObj;