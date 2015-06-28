var mongoose = require('mongoose'),
    da = require("./da");

var liteSchema = mongoose.Schema({
      name : String,
      type : String
    }),
    lightObj = mongoose.model("Light", liteSchema),
    lightDa = new da("light", lightObj);

lightObj.methods = lightDa;

module.exports = lightObj;
