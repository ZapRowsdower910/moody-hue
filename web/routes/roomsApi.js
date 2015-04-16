/**
  Has ErrorNo's 300 - 350

**/

var log = require("log4js").getLogger("Rooms-Api");

var router = require("./baseApi");

var Room = require("../../models/Room"),
    Light = require("../../models/Light"),
    ApiResponse = require("../../objects/ApiResponse");

router
  .get("/rooms", function(req, res){
    Room.find(function(e, rooms){
      // build err state resp
      respObj = new ApiResponse();

      if(e){
        log.error("encountered exception while attempting to get all rooms from mongo:", e);
        res.status(500).json(respObj);
      }

      log.info("Found rooms [%s]", rooms.length, rooms);
      
      respObj.success(rooms);
      res.json(respObj);
    })
  })

  .get("/rooms/:id", function(req, res){
    log.info("rooms/:id - id [%s]", req.params.id)
    var respObj = new ApiResponse();

    Room.findById(req.params.id, function(e, r){
      if(e){
        log.error("encountered exception while attempting to get room [%s] from mongo:", res.params.id,e);
        res.status(500).json(respObj);
      }

      respObj.success(r);
      res.json(respObj);

    })

  })

  .post("/rooms/add", function(req, res){

    var name = req.body.name,
        room = new Room(),
        respObj = new ApiResponse();

    if(name){
      room.name = name;

      room.save(function(e, r){
        if(e){
          res.status(500).json(respObj);
        }

        respObj.success(r);
        res.json(respObj);
      });
    } else {
      respObj.ErrorNo = 300;
      respObj.ErrorDesc = "Invalid Room name";
      res.status(500).json(respObj);
    }
    

  })

  .put("/rooms/add/light", function(req, res){
    var roomId = req.body.roomId,
        lightId = req.body.lightId,
        respObj = new ApiResponse();

    if(roomId && lightId){

      log.info("Searching for roomId [%s]", roomId);
      Room.findById(roomId, function(e, r){
        if(e)  {
          log.error("error while attempting to find room roomId[%s]", roomId, se);
          res.status(500).json(resjObj);
        }

        if(r){

          log.info("Looking for lightId [%s]", lightId);
          Light.findById(lightId, function(e, lite){
            if(e){
              log.error("error while attempting to find light lightId [%s]", lightId, e);
              res.status(500).json(respObj);
            }

            log.info("Found both room and light");
            r.lights.push(lite);

            r.save(function(e, rm){
              if(e){
                log.error("error while attempting to save room:", r);
                res.status(500).json(respObj);
              }

              log.info("Added room to light");
              respObj.success(r);
              res.json(respObj);
            });

          });
        } else {
          respObj.ErrorNo = 303;
          respObj.ErroDesc = "Unable to find room";
          res.status(404).json(respObj);
        }
        
      })
      
    } else {
      log.error("Invalid params for /rooms/light/add roomId [%s] lightId[%s]");
      respObj.ErrorNo = 301;
      respObj.ErrorDesc = "Invalid roomId or lightId";
      res.status(500).json(respObj);
    }
  })