var mongoose = require('mongoose'),
    da = require("./da");

var sceneSchema = mongoose.Schema({
      name : String,
      lights : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Light' }],
      state : { type: mongoose.Schema.Types.ObjectId, ref: 'State' }
    }),
    sceneObj = mongoose.model("Scene", sceneSchema);
    sceneDa = new da("scene", sceneObj, ["lights", "state", "color"]);

sceneObj.methods = sceneDa;

module.exports = sceneObj;