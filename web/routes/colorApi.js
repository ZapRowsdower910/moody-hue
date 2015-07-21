/**
*	Color Error Range: 400-450
**/
var when = require("when"),
    log = require("log4js").getLogger("Color-Api");

var router = require("./baseApi");

var Colors = require("../../models/Color"),
	  ApiResponse = require("../../objects/ApiResponse");

router
	.get("/colors", function(req, res){
		respObj = new ApiResponse();

		Colors.getAll().then(function(colors){
			respObj.success(colors);
    		res.json(respObj);

		}).catch(function(e){
			res.status(500).json(respObj);
		});
	})

	.post("/colors/add", function(req, res){
		var r = req.body.r,
			g = req.body.g,
			b = req.body.b,
			respObj = new ApiResponse(),
			color;

		log.info(req.body);

		if(r && g && b){

			// color = new Color({"r":r,"g":g,"b":b});
			color = new Colors(req.body);
			log.info("Created new color [%o]", color);

			color.saveMe(color).then(function(c){
				respObj.success(c);
        		res.json(respObj);

			}).catch(function(e){
				res.status(500).json(respObj);	
			});

		} else {
			log.error("Invalid color params [%s]", req.body);
	      	respObj.ErrorNo = 400;
	      	respObj.ErrorDesc = "Invalid color request";
	      	res.status(500).json(respObj);
		}

		
	})

	.delete("/colors/:id", function(req, res){
	    var colorId = req.params.id;
	        respObj = new ApiResponse();

	    if(colorId){
	      Colors.delete(colorId).then(function(c){
	        if(c){
	          
	          // try to get all the remaining colors to return on the response.
	          // The getAll() call is a convenience call and not critical. 
	          // Its isn't important enough to cause a failure response
	          // if that call fails just return back an empty success.
	          Colors.getAll().then(function(colors){
	            respObj.success(colors);
	            res.json(respObj);

	          }).catch(function(e){
	            respObj.success({});
	            res.json(respObj);

	          });

	        } else {
	          respObj.ErrorNo = 402;
	          respObj.ErrorDesc = "Unable to find color";
	          res.status(404).json(respObj);
	        }

	      }).catch(function(e){
	        respObj.ErrorNo = 403;
	        respObj.ErrorDesc = "Failed to remove color";
	        res.status(500).json(respObj);  
	  
	      });

	    } else {
	      log.error("Invalid colorId [%s]", colorId);
	      respObj.ErrorNo = 401;
	      respObj.ErrorDesc = "Invalid colorId"
	      res.status(500).json(respObj);
	    }

	  })


log.info("Colors api loaded");