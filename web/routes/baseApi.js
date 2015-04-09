/**
  Has ErrorNo's:
    - 100 - 200
**/
var router = require("express").Router(),
    log = require("log4js").getLogger("ROUTE-BaseAPI");

var Room = require("../../models/Room");

router.
  get("/", function(req, res){
    log.info("api/ hit!");
    res.json({message : 'api request completed'});
  })

module.exports = router;