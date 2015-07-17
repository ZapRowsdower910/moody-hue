var _ = require("lodash"),
    when = require("when"),
    mongoose = require('mongoose'),
    staticDa = require("./da").statics,
    instanceDa = require("./da").instance,
    plugins = require("../pluginManager").plugins.handlers.lights;

var liteSchema = mongoose.Schema({
      name : String,
      type : String,
      apiId : String
    }),
    lightObj;
    // lightDa = new da("light");

var locals = {
      turnOn: function(){
        console.log(this);
        plugins["hue"].set({ on: true });
      },
      isOn : function(){
        console.log("this:", this)

        return plugins["hue"].get("/lights/1").then(function(details){

          if(details.state.on){
            log.debug("Light is on")
            return when.resolve();
          } else{
            log.debug("Light is off")
            return when.reject();
          }
        })
      }
    }

var mergedInstance = _.assign({}, instanceDa, locals);

liteSchema.methods = mergedInstance;
liteSchema.statics = staticDa;

lightObj = mongoose.model("Light", liteSchema),

module.exports = lightObj;