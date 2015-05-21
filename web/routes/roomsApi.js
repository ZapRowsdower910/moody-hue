/**
  Has ErrorNo's 300 - 350

**/

var log = require("log4js").getLogger("Rooms-Api");

var router = require("./baseApi");

var Room = require("../../models/Room"),
    Light = require("../../models/Light"),
    ApiResponse = require("../../objects/ApiResponse"),
    roomUtils = require("../../rooms");

log.warn(roomUtils);

router
  .get("/rooms", function(req, res){
    var respObj = new ApiResponse();

    roomUtils.getAll().then(function(rooms){
      respObj.success(rooms);
      res.json(respObj);

    }).catch(function(e){
      res.status(500).json(respObj);
    });

  })

  .get("/rooms/:id", function(req, res){
    log.info("rooms/:id - id [%s]", req.params.id)
    var respObj = new ApiResponse(),
        roomId = req.params.id;

    if(roomId){
      roomUtils.getById(roomId).then(function(room){
        respObj.success(room);
        res.json(respObj);

      }).catch(function(e){
        respObj.ErrorNo = 303;
        respObj.ErroDesc = "Unable to find room";
        res.status(404).json(respObj);

      });

    } else {
      log.error("Invalid params for /rooms/light/add roomId [%s] lightId[%s]");
      respObj.ErrorNo = 301;
      respObj.ErrorDesc = "Invalid roomId";
      res.status(500).json(respObj);
    }

  })

  .post("/rooms/add", function(req, res){

    var name = req.body.name,
        room = new Room(),
        respObj = new ApiResponse();

    if(name){
      room.name = name;

      roomUtils.save(room).then(function(){
        respObj.success(room);
        res.json(respObj);

      }).catch(function(e){
        res.status(500).json(respObj);

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

      roomUtils.getById(roomId).then(function(room){
        if(room){
          log.info("Room found, now searching for lightId [%s]", lightId);

          lightUtils.getById(lightId).then(function(light){

            log.info("Found both room and light. Starting pairing..");
            // TODO: Check to see if room already has light

            room.lights.push(light);

            roomUtils.save(room).then(function(){
              log.info("Light added to rooom successfully!");
              respObj.success(room);
              res.json(respObj);

            }).catch(function(e){

              res.status(500).json(respObj);
            });

          }).catch(function(e){
            log.info("Failed to find light.");

            respObj.ErrorNo = 353;
            respObj.ErrorDesc = "Unable to find light";
            res.status(404).json(respObj);
          });

        }

      }).catch(function(e){
        log.info("Failed to find room.");

        respObj.ErrorNo = 303;
        respObj.ErroDesc = "Unable to find room";
        res.status(404).json(respObj);
      });
      
    } else {
      log.error("Invalid params for /rooms/light/add roomId [%s] lightId[%s]");
      respObj.ErrorNo = 302;
      respObj.ErrorDesc = "Invalid roomId or lightId";
      res.status(500).json(respObj);
    }
  })


log.info("Rooms api loaded");