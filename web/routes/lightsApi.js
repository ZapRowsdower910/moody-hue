/**
  Has ErrorNo's 351 - 400
**/

var when = require("when"),
    log = require("log4js").getLogger("Lights-Api");

var router = require("./baseApi");

var Light = require("../../models/Light");
    Room = require("../../models/Room"),
    ApiResponse = require("../../objects/ApiResponse"),
    lightUtils = require("../../lights"),
    events = require("../../eventHelper");


events.subscribe("lights:remove", function(e){
  log.info("Heard lights:remove:", e);

})

router
  
  .get("/lights", function(req, res){

    var respObj = new ApiResponse();

    lightUtils.getAll().then(function(lights){
      respObj.success(lights);
      res.json(respObj);

    }).catch(function(){
      res.status(500).json(respObj);
    });

  })

  .get("/lights/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){

      lightUtils.getById(lightId).then(function(light){
          respObj.success(light);
          res.json(respObj);

      }).catch(function(e){
        respObj.ErrorNo = 353;
        respObj.ErrorDesc = "Unable to find light";
        res.status(404).json(respObj);

      });

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

      lightUtils.save(light).then(function(l){
        respObj.success(l);
        res.json(respObj);

      }).catch(function(e){
        res.status(500).json(respObj);
      })

    } else {
        respObj.ErrorNo = 351;
        respObj.ErrorDesc = "Invalid request body or light name";
        res.status(500).json(respObj);
      }
    

  })

  .put("/lights/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){
      Light.findById(lightId, function(e, l){
        if(e){
          log.error("exception while attempting to find light to update - lightId [%s]", lightId, e);
          res.status(500).json(respObj);
        }

        if(l){
          log.debug("found light using lightId [%s]", lightId);

          var name = req.body.name;

          l.name = name;

          l.save(function(e, updatedLight){
             if(e){
              log.error("exception while attempting to update light - lightId [%s]", lightId, e);
              res.status(500).json(respObj);
            }

            respObj.success({});
            res.json(respObj);
          })

          
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

  .delete("/lights/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){
      lightUtils.delete(lightId).then(function(l){
        if(l){
          
          // try to get all the remaining lights to return on the response.
          // The getAll() call is a convenience call and not critical. 
          // Its isn't important enough to cause a failure response
          // if that call fails just return back an empty success.
          lightUtils.getAll().then(function(lights){
            respObj.success(lights);
            res.json(respObj);

          }).catch(function(e){
            respObj.success({});
            res.json(respObj);

          });

        } else {
          respObj.ErrorNo = 353;
          respObj.ErrorDesc = "Unable to find light";
          res.status(404).json(respObj);
        }

      }).catch(function(e){
        respObj.ErrorNo = 354;
        respObj.ErrorDesc = "Failed to remove light";
        res.status(500).json(respObj);  
  
      });

    } else {
      log.error("Invalid lightId [%s]", lightId);
      respObj.ErrorNo = 352;
      respObj.ErrorDesc = "Invalid lightId"
      res.status(500).json(respObj);
    }

    return dfd.promise;
  })




 log.info("Lights api loaded");
