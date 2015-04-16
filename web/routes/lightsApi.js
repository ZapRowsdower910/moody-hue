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

  .get("/lights/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){
      Light.findById(lightId, function(e, l){
        if(e){
          log.error("exception while attempting to find light lightId [%s]", lightId, e);
          res.status(500).json(respObj);
        }

        if(l){
          log.debug("Found light [%s] using lightId [%s]", l, lightId);

          respObj.success(l);
          res.json(respObj);
        } else {
          respObj.ErrorNo = 353;
          respObj.ErrorDesc = "Unable to find light";
          res.status(404).json(respObj);
        }
      })
    } else {
      log.error("Invalid lightId [%s]", lightId);
      respObj.ErrorNo = 352;
      respObj.ErrorDesc = "Invalid lightId"
      res.status(500).json(respObj);
    }

  })

  .post("/lights/add", function(req, res){
    var light = new Light(),
        respObj = new ApiResponse();

    if(req.body && req.body.name){

      light.name = req.body.name;

      light.save(function(e, l){
        if(e){
          log.error("error while attempting to save light:",light,e);
          res.status(500).json(respObj);
        }

        log.info("Successfully added a new light name [%s]", light.name);
        respObj.success(l);
        res.json(respObj);
      })
    } else {
        respObj.ErrorNo = 351;
        respObj.ErrorDesc = "Invalid request body or light name";
        res.status(500).json(respObj);
      }
    

  })

  .delete("/lights/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){
      Light.findOneAndRemove(lightId, function(e, l){
        if(e){
          log.error("exception while attempting to remove light lightId [%s]", lightId, e);
          res.status(500).json(respObj);
        }

        log.info(l)

        if(l){
          log.debug("deleted light using lightId [%s]", lightId);

          respObj.success({});
          res.json(respObj);
        } else {
          respObj.ErrorNo = 353;
          respObj.ErrorDesc = "Unable to find light";
          res.status(404).json(respObj);
        }
      })
    } else {
      log.error("Invalid lightId [%s]", lightId);
      respObj.ErrorNo = 352;
      respObj.ErrorDesc = "Invalid lightId"
      res.status(500).json(respObj);
    }

  })