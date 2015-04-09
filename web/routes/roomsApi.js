/**
  Has ErrorNo's 300 - 350

**/

var log = require("log4js").getLogger("Rooms-Api");

var router = require("./baseApi");

var Room = require("../../models/Room"),
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
    

  });