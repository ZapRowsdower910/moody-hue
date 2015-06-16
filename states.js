var when = require("when"),
	log = require("log4js").getLogger("StateDa");

var da = require("./da"),
	State = require("./models/State"),
	events = require("./eventHelper");

var stateDa = new da("state", State, ["color"]);

module.exports = stateDa;