/**
  Has ErrorNo's 351 - 400
**/

var log = require("log4js").getLogger("Lights-Api");

var router = require("./baseApi");

var Light = require("../../models/Light");
    Room = require("../../models/Room"),
    ApiResponse = require("../../objects/ApiResponse");


router
  
  .get("/lights", function(req, res){

    Light.find(function(e, lights){
      var respObj = new ApiResponse();

      if(e){
        log.error("Exception during get all lights:",e);
        res.status(500).json(respObj);
      }

      log.info("Found [%s] lights", lights.length, lights);

      respObj.success(lights);
      res.json(respObj);
    });

  })

  .post("/lights/add", function(req, res){
    var light = new Light(),
        respObj = new ApiResponse();

    if(req.body && req.body.name){

      light.name = req.body.name;

      light.save(function(e, l){
        if(e){
          res.status(500).json(respObj);
        }

        respObj.success(l);
        res.json(respObj);
      })
    } else {
        respObj.ErrorNo = 351;
        respObj.ErrorDesc = "Invalid request body or light name";
        res.status(500).json(respObj);
      }
    

  })