var _ = require("lodash"),
    needle = require("needle"),
    when = require("when"),
    hueUtils = require("./hue/utils"),
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

    var mappedChange = {
      "on": change.bri > 0 ? true : false,
      "bri": change.bri,
      "transitiontime": change.transition,
      "xy": hueUtils.convertRGBtoXY(change.color[0], "lct")
    };
log.info(arguments);
    // TODO: Normalize resp
    return http.put("/lights/" + lightId + "/state", mappedChange);
  }
}

var colorLimits = {
  bulb: {
    r: [0.675, 0.322],
    g: [0.409, 0.518],
    b: [0.167, 0.04]
  }
};

var utils = {
  adjustColorToRange: function(rgb){
    // TODO: add support for different types of bulbs + ranges
    var limit = colorLimits.bulb;

    // rgb.r = utils.checkRange(rgb.r, limit.r);
    // rgb.g = utils.checkRange(rgb.g, limit.g);
    // rgb.b = utils.checkRange(rgb.b, limit.b);

    rgb = {
      r: limit.r[0] - .001,
      g: limit.g[0] - .001,
      b: limit.b[0] + .001
    }

    return rgb;
  },
  checkRange: function(val, limits){
    
    if(val > limits[0]){
      return limits[0];
    } else if(val < limits[1]){
      return limits[1];
    }
  }
};

var converters = {
  rgbToXy: function(rInt, gInt, bInt){
    var rgb;

    log.info("rgb: ", rInt, gInt, bInt);
    // Convert to decimel
    var r = converters.toDecimel(rInt),
        g = converters.toDecimel(gInt),
        b = converters.toDecimel(bInt);

    log.info("r g b floats:", r, g, b);

    // Apply Gama correction ( compinsates for viewing color on back lite screen )
    var red = (r > 0.04045) ? Math.pow((r + 0.055) / (1.0 + 0.055), 2.4) : (r / 12.92),
        green = (g > 0.04045) ? Math.pow((g + 0.055) / (1.0 + 0.055), 2.4) : (g / 12.92),
        blue = (b > 0.04045) ? Math.pow((b + 0.055) / (1.0 + 0.055), 2.4) : (b / 12.92);

    rgb = utils.adjustColorToRange({
      r: red,
      g: green,
      b: blue
    });
    log.info("rgb after color correction: ", rgb);

    // Convert to X Y Z
    var X = rgb.r * 0.664511 + rgb.g * 0.154324 + rgb.b * 0.162028,
        // INSIGHT - the Y value from this will reprecent the brightness
        Y = rgb.r * 0.283881 + rgb.g * 0.668433 + rgb.b * 0.047685,
        Z = rgb.r * 0.000088 + rgb.g * 0.072310 + rgb.b * 0.986039;

    // Convert to hue x y
    var x = parseFloat((X / (X + Y + Z)).toFixed(3)),
        y = parseFloat((Y / (X + Y + Z)).toFixed(3));

    // TODO: add check for if within lights display params
    log.info("Final x y values: ", x, y);

    return [x, y];
  },
  toDecimel: function(num){
    return num / 255.0;
  }
}

module.exports = methods;