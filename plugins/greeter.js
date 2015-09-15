var _ = require("lodash"),
    when = require("when"),
    log4js = require("log4js"),
    log = log4js.getLogger("Greeter Plugin");

var settings  = {
  type: "greeter"
};

var methods = {
  init: function(plugins){
    plugins.service[settings.type] = methods;

    log.debug("Loaded Hue Api plugin");
  }
};

module.exports = methods;