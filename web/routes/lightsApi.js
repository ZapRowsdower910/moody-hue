/**
  Has ErrorNo's 351 - 400
**/

var _ = require("lodash"),
    when = require("when"),
    log = require("log4js").getLogger("Lights-Api");

var router = require("./baseApi");

var Lights = require("../../models/Light"),
    LightDa = require("../../models/Light"),
    Room = require("../../models/Room"),
    ApiResponse = require("../../objects/ApiResponse"),
    events = require("../../eventHelper");

var test = new Lights({
  name: "Living room 1",
  type: "hue",
  apiId: "1"
})

// console.log(LightDa);

// console.log(test)
// // console.log(_.functions(test))
// console.log("turnOn" in test);

// test.isOn().then(function(){
//   log.info("light is on")
// }, function(){
//   log.info("light is off")
// })

events.subscribe("lights:remove", function(e){
  log.info("Heard lights:remove:", e);

})

router

  .put("/lights/turnOn/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){

      log.debug("Looking for lightid [%s]", lightId);
      Lights.getById(lightId).then(function(light){
          log.debug("Found light, turning it off");
          light.turnOn().then(function(r){
            respObj.success(r);
            res.json(respObj);
          }).catch(function(e){
            log.error(e);

            respObj.ErrorNo = 500;      // TODO: pick a real err no someday
            respObj.ErrorDesc = "Failed to turn on light";
            res.status(404).json(respObj);    
          });
          

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

.put("/lights/turnOff/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){

      log.debug("Looking for lightid [%s]", lightId);
      Lights.getById(lightId).then(function(light){
          log.debug("Found light, turning it off");
          light.turnOff().then(function(r){
            respObj.success(r);
            res.json(respObj);
          }).catch(function(e){
            log.error(e);

            respObj.ErrorNo = 500;      // TODO: pick a real err no someday
            respObj.ErrorDesc = "Failed to turn off light";
            res.status(404).json(respObj);    
          });
          

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

  .get("/lights/isOn/:id", function(req, res){
    var lightId = req.params.id;
        respObj = new ApiResponse();

    if(lightId){

      log.debug("Looking for lightId [%s]", lightId);
      Lights.getById(lightId).then(function(light){
          log.debug("Found light, checkin' state");
          light.isOn().then(function(r){
              respObj.success({"isOn":true});
              res.json(respObj);

            }, function(){
              respObj.success({"isOn":false});
              res.json(respObj);
            }
          ).catch(function(e){
            log.error(e);

            respObj.ErrorNo = 500;      // TODO: pick a real err no someday
            respObj.ErrorDesc = "Failed to turn on light";
            res.status(404).json(respObj);    
          });
          

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

/***
 Normal Crud Methods

***/
  
  .get("/lights", function(req, res){

    var respObj = new ApiResponse();

    Lights.getAll().then(function(lights){
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

      Lights.getById(lightId).then(function(light){
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
    var respObj = new ApiResponse(),
        light;

    if(req.body && req.body.name){

      light = new Lights(req.body);

      light.saveMe().then(function(l){
        respObj.success(l);
        res.json(respObj);

      }).catch(function(e){
        log.error(e);
        res.status(500).json(respObj);
      })

    } else {
      respObj.ErrorNo = 351;
      respObj.ErrorDesc = "Invalid request body or light name";
      res.status(500).json(respObj);
    }
    

  })

  .put("/lights/:id", function(req, res){
    var lightId = req.params.id,
        respObj = new ApiResponse(),
        updatedLight;

    if(lightId){
      Lights.findById(lightId, function(e, light){
        if(e){
          log.error("exception while attempting to find light to update - lightId [%s]", lightId, e);
          res.status(500).json(respObj);
        }

        if(light){
          log.debug("found light using lightId [%s]", lightId);

          // var name = req.body.name;

          updatedLight = new Lights(req.body);
          // updatedLight._id = light._id;

          console.log(updatedLight)
          console.log(light)
_.assign(light, _.omit(updatedLight, "_id", "__v"));
          console.log(light)

          light.saveMe().then(function(l){
            respObj.success(l);
            res.json(respObj);

          }).catch(function(e){
            log.error(e);
            res.status(500).json(respObj);
          })
          // (function(e, updatedLight){
          //    if(e){
          //     log.error("exception while attempting to update light - lightId [%s]", lightId, e);
          //     res.status(500).json(respObj);
          //   }

          //   respObj.success({});
          //   res.json(respObj);
          // })

          
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
      Lights.delete(lightId).then(function(l){
        if(l){
          
          // try to get all the remaining lights to return on the response.
          // The getAll() call is a convenience call and not critical. 
          // Its isn't important enough to cause a failure response
          // if that call fails just return back an empty success.
          Lights.getAll().then(function(lights){
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

  })




 log.info("Lights api loaded");
