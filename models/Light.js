var _ = require("underscore"),
    when = require("when"),
    mongoose = require('mongoose'),
    da = require("./da").methods,
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

var merged = _.extend({}, da, locals);

log.info("Merged:", merged)

liteSchema.methods = merged;
// lightObj.virtuals = v;
// lightObj.methods.isOn = v.isOn;

// liteSchema.methods = locals;

// plugins["hue"].get("/lights/").then(function(l){
//   _.each(l, function(){

//   })
// });

 lightObj = mongoose.model("Light", liteSchema),

module.exports = lightObj;
module.exports.da = da;