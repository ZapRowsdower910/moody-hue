var when = require("when"),
	log = require("log4js").getLogger("ScenesDa");

var da = require("./da"),
	Scene = require("./models/Scene"),
	sceneDa = new da("scene", Scene),
	events = require("./eventHelper");

var scenesDa = new da("scene", Scene, ["rooms", "states"]);

module.exports = scenesDa;