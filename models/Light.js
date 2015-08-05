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
  getType: function(type){

    if(plugins[type]){
      return plugins[type];
    } else {
      log.debug("unable to map the type of [%s] to any installed plugin", type);
      throw Exception("Type not found");
    }
  },
  turnOn: function(){
    return locals.getType(this.type).set(this.apiId, {"on": true });
  },
  turnOff: function(){
    return locals.getType(this.type).set(this.apiId, {"on": false });
  },
  isOn : function(){

    return locals.getType(this.type).get(this.apiId).then(function(details){

      if(details.state.on){
        log.debug("Light is on")
        return when.resolve();
      } else{
        log.debug("Light is off")
        return when.reject();
      }
    });
  }
}

var mergedInstance = _.assign({}, instanceDa, locals);

liteSchema.methods = mergedInstance;
liteSchema.statics = staticDa;

lightObj = mongoose.model("Light", liteSchema),

module.exports = lightObj;