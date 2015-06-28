var mongoose = require('mongoose'),
    da = require("./da");;

var colorSchema = mongoose.Schema({
      name : String,
      r : { type: Number, min: 0, max: 255 },
      g : { type: Number, min: 0, max: 255 },
      b : { type: Number, min: 0, max: 255 }
    }),
    colorObj = mongoose.model("Color", colorSchema);
    colorDa = new da("color", colorObj);

colorObj.methods = colorDa;

module.exports = colorObj;