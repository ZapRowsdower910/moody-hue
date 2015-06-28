/**
  Has ErrorNo's 300 - 350

**/

var log = require("log4js").getLogger("Rooms-Api");

var router = require("./baseApi");

var Rooms = require("../../models/Room"),
    Light = require("../../models/Light"),
    ApiResponse = require("../../objects/ApiResponse");

router
  .get("/rooms", function(req, res){
    var respObj = new ApiResponse();

    Rooms.methods.getAll().then(function(rooms){
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
      Rooms.methods.getById(roomId).then(function(room){
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

    var name = req.body.name || false,
        room = new Room(),
        respObj = new ApiResponse();

    if(name){
      room.name = name;

      Rooms.methods.save(room).then(function(){
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

  .post("/rooms/:id", function(req, res){
    var id = req.body.id || false,
        respObj = new ApiResponse();

    Room.findById(id, function(e, r){
      if(e){
        log.error("encountered exception while attempting to get room [%s] from mongo:", id,e);
        res.status(500).json(respObj);
      }

      if(r){

        var name = req.body.name;

        r.name = name;

        r.save(function(e){
          if(e){
            log.error("encountered exception while attempting to get room [%s] from mongo:", id,e);
            res.status(500).json(respObj);
          }

          respObj.success(r);
          res.json(respObj);  
        })

      } else {
        respObj.ErrorNo = 303;
        respObj.ErroDesc = "Unable to find room";
        res.status(404).json(respObj);
      }

    })

  })

  .post("/rooms/add/light", function(req, res){
    var roomId = req.body.roomId,
        lightId = req.body.lightId,
        respObj = new ApiResponse();

    if(roomId && lightId){

      log.info("Searching for roomId [%s]", roomId);

      Rooms.methods.getById(roomId).then(function(room){
        if(room){
          log.info("Room found, now searching for lightId [%s]", lightId);

          lightUtils.getById(lightId).then(function(light){

            log.info("Found both room and light. Starting pairing..");
            // TODO: Check to see if room already has light

            room.lights.push(light);

            Rooms.methods.save(room).then(function(){
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

  .delete("/rooms/:id", function(req, res){
    var roomId = req.params.id;
        respObj = new ApiResponse();

    if(roomId){
      Rooms.methods.delete(roomId).then(function(l){
        if(l){
          
          // try to get all the remaining lights to return on the response.
          // The getAll() call is a convenience call and not critical. 
          // Its isn't important enough to cause a failure response
          // if that call fails just return back an empty success.
          Rooms.methods.getAll().then(function(rooms){
            respObj.success(rooms);
            res.json(respObj);

          }).catch(function(e){
            respObj.success({});
            res.json(respObj);

          });

        } else {
          respObj.ErrorNo = 303;
          respObj.ErrorDesc = "Unable to find room";
          res.status(404).json(respObj);
        }

      }).catch(function(e){
        respObj.ErrorNo = 304;
        respObj.ErrorDesc = "Failed to remove room";
        res.status(500).json(respObj);  
  
      });

    } else {
      log.error("Invalid roomId [%s]", roomId);
      respObj.ErrorNo = 302;
      respObj.ErrorDesc = "Invalid roomId"
      res.status(500).json(respObj);
    }
    
  })
  

log.info("Rooms api loaded");