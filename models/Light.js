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

// Local instance methods
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
  },
  setState: function(state){
console.log(this);
    return locals.getType(this.type).set(this.apiId, state).then(function(r){
      log.info("Result of setState [%o]", r);

      return r;
    });

  }
};

// Merge generic DA w/ local instance methods
var mergedInstance = _.assign({}, instanceDa, locals);

// Add instance methods
liteSchema.methods = mergedInstance;
// Add Static methods
liteSchema.statics = staticDa;

// Create Schema
lightObj = mongoose.model("Light", liteSchema),

module.exports = lightObj;