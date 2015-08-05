var _ = require("underscore"),
    needle = require("needle"),
    when = require("when"),
    log4js = require("log4js"),
    log = log4js.getLogger("Hue API");

var settings = {
  "type":"hue"
}, http, methods;

var configs = {
  general : {
    apiName : "huey-moods"
  },
  hue: {
    baseIp: "192.168.1.183"
  }
}

http = {
  get : function(path){
    var dfd = when.defer();

    log.debug("Sending a GET request to hue base server [%s] using endpoint [%s]", configs.hue.baseIp, path);

    // when(api.isSetup()).then(function(){
      needle.get(configs.hue.baseIp + "/api/" + configs.general.apiName + path, function(err, resp){
        if(!err){
          
          var rsp = resp.body;
          if(_.isArray(rsp) && rsp[0].error){
            utils.apiError(rsp[0]);
            dfd.reject(rsp[0]);

          } else {
            dfd.resolve(rsp);
          }
        } else {

          var details = {
            path : configs.hue.baseIp + "/api/" + configs.general.apiName + path,
            args : arguments
          };
          utils.requestError(err,details);
          dfd.reject(err);
        }
      });
    // }
    // ,
    // function(err){
    //   dfd.reject(err);
    // });
    
    return dfd.promise;
  },
  put : function(path,data){
    var dfd = when.defer();
console.log(data)
    log.debug("Sending a PUT request to hue base server [%s] using endpoint [%s]", configs.hue.baseIp, path);
    
    // when(api.isSetup()).then(function(){
      needle.put(configs.hue.baseIp + "/api/" + configs.general.apiName + path, data, {json : true}, function(err, resp){
        if(!err){
          dfd.resolve(resp.body);
        } else {
          console.log("detected put err on success resp")
          dfd.reject(err);
        }
      });
    // }
    // ,
    // function(err){
    //   dfd.reject(err);
    // });
    
    return dfd.promise;
  }
};


var methods = {
  init: function(plugins){
    plugins.handlers.lights[settings.type] = methods;

    log.debug("Loaded Hue Api plugin");
  },
  get: function(lightId, path){
    log.info("gettin' stuff", lightId, path)
    // TODO: normalize resp
    return http.get("/lights/" + lightId);
  },
  set: function(lightId, change){
    // TODO: Normalize resp
    return http.put("/lights/" + lightId + "/state", change);
  }
}

module.exports = methods;