/**
*	Scene Error Range: 400-450
**/
var when = require("when"),
    log = require("log4js").getLogger("Scene-Api");

var router = require("./baseApi");

var Scene = require("../../models/Scene"),
	ApiResponse = require("../../objects/ApiResponse"),
	sceneUtils = require("../../scenes");

router
	.get("/scenes", function(req, res){
		respObj = new ApiResponse();

		sceneUtils.getAll().then(function(scenes){
			respObj.success(scenes);
    		res.json(respObj);

		}).catch(function(e){
			res.status(500).json(respObj);
		});
	})

	.post("/scenes/add", function(req, res){
		var name = req.body.name,
			rooms = req.body.rooms,
			groups = req.body.groups,
			state = req.body.state,
			respObj = new ApiResponse(),
			scene;

		log.info(req.body);

		log.info("name [%s] room [%o] group [%o] state [%o]", name, rooms, groups, state)

		// We can have either a room or a group as the scene target
		if(name && state && (rooms || groups)){

			// TODO: obv not the safest methodology. Decide if i care
			scene = new Scene(req.body);
			log.info("Created new scene [%o]", scene);

			sceneUtils.save(scene).then(function(c){
				respObj.success(c);
        		res.json(respObj);

			}).catch(function(e){
				res.status(500).json(respObj);	
			});

		} else {
			log.error("Invalid scene params [%o]", req.body);
	      	respObj.ErrorNo = 400;
	      	respObj.ErrorDesc = "Invalid scene request";
	      	res.status(500).json(respObj);
		}

		
	})

	.delete("/scenes/:id", function(req, res){
	    var sceneId = req.params.id;
	        respObj = new ApiResponse();

	    if(sceneId){
	      sceneUtils.delete(sceneId).then(function(c){
	        if(c){
	          
	          // try to get all the remaining scenes to return on the response.
	          // The getAll() call is a convenience call and not critical. 
	          // Its isn't important enough to cause a failure response
	          // if that call fails just return back an empty success.
	          sceneUtils.getAll().then(function(scenes){
	            respObj.success(scenes);
	            res.json(respObj);

	          }).catch(function(e){
	            respObj.success({});
	            res.json(respObj);

	          });

	        } else {
	          respObj.ErrorNo = 402;
	          respObj.ErrorDesc = "Unable to find scene";
	          res.status(404).json(respObj);
	        }

	      }).catch(function(e){
	        respObj.ErrorNo = 403;
	        respObj.ErrorDesc = "Failed to remove scene";
	        res.status(500).json(respObj);  
	  
	      });

	    } else {
	      log.error("Invalid sceneId [%s]", sceneId);
	      respObj.ErrorNo = 401;
	      respObj.ErrorDesc = "Invalid sceneId"
	      res.status(500).json(respObj);
	    }

	  })


log.info("Scenes api loaded");