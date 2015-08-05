/**
*	Scene Error Range: 400-450
**/
var when = require("when"),
    log = require("log4js").getLogger("Scene-Api");

var router = require("./baseApi");

var Scenes = require("../../models/Scene"),
		Light = require("../../models/Light"),
		State = require("../../models/State"),
		ApiResponse = require("../../objects/ApiResponse");

router

	.get("/scenes/:id", function(req, res){
    var sceneId = req.params.id;
        respObj = new ApiResponse();

    if(sceneId){

      Scenes.getById(sceneId).then(function(scene){
          respObj.success(scene);
          res.json(respObj);

      }).catch(function(e){
        respObj.ErrorNo = 353;
        respObj.ErrorDesc = "Unable to find scene";
        res.status(404).json(respObj);

      });

    } else {
      log.error("Invalid sceneId [%s]", sceneId);
      respObj.ErrorNo = 352;
      respObj.ErrorDesc = "Invalid sceneId"
      res.status(500).json(respObj);
    }

  })

	.get("/scenes", function(req, res){
		respObj = new ApiResponse();

		Scenes.getAll().then(function(scenes){
			respObj.success(scenes);
    		res.json(respObj);

		}).catch(function(e){
			res.status(500).json(respObj);
		});
	})

	.post("/scenes/add", function(req, res){
		var name = req.body.name,
				lights = req.body.lights,
				state = req.body.state,
				respObj = new ApiResponse(),
				scene;

		log.info(req.body);

		log.info("name [%s] lights [%o] state [%o]", name, lights, state)

		// We can have either a room or a group as the scene target
		if(name && state && lights){

			req.body.state = utils.validateReference(state, State)
			// req.body.lights = utils.validateReference(lights, Light)

			// TODO: obv not the safest methodology. Decide if i care
			scene = new Scenes(req.body);
			log.info("Created new scene [%o]", scene);

			scene.saveMe(scene).then(function(c){
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
	      Scenes.delete(sceneId).then(function(c){
	        if(c){
	          
	          // try to get all the remaining scenes to return on the response.
	          // The getAll() call is a convenience call and not critical. 
	          // Its isn't important enough to cause a failure response
	          // if that call fails just return back an empty success.
	          Scenes.getAll().then(function(scenes){
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


var utils = {
	validateReference: function(reqObj, daObj){
		typeof reqObj == 'object' ? console.log("_id" in reqObj) : console.log(reqObj);

		// TODO: Consider if more validation should be done here - Currently an invalid
		// id will get added successfully.
		
		// if its a string assume its an id
		if(typeof reqObj == 'string'){
			return reqObj;
		}

		if(reqObj._id == undefined){
			log.info("replacing request object w/ da obj");
			var newDaObj = new daObj(reqObj);
			return newDaObj
		}else {
			log.info("id in obj", reqObj._id);
		}

		return reqObj;
	}
}


log.info("Scenes api loaded");