var _ = require("lodash"),
    when = require("when"),
    log4js = require("log4js"),
    log = log4js.getLogger("Greeter Plugin");

var router = require("../baseApi"),
    ConfigSchema = require("./greeter/SettingsModel");

var settings  = {
  type: "greeter"
};

var methods = {
  init: function(plugins){
    plugins.service[settings.type] = methods;

    log.debug("Loaded Hue Api plugin");
  }
};

router
  .post("/greeter/arrive", function(req, res){
    log.info("Welcome home, let me get the lights for ya");

    // grab arrival lights

    // grab screne data

    // set scene
  })

  .post("/greeter/config", function(req, res){
    var config = req.body;
    log.info("setting new configs");

  })

module.exports = methods;