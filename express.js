var express = require("express"),
	_ = require("underscore"),
	when = require("when"),
	log4js = require("log4js"),

	logger = log4js.getLogger("Express");

var hue = require("./hue-api"),
	configs = require("./state");

var app = express(),
	http = require("http").createServer(app),
	// bodyParser = require("body-parser"),

	server = http.listen(8080, "192.168.1.7", function(){
		logger.info("====================================================");
		logger.info("=========== [ Starting up Web service ] ============");
	    logger.info("=========== [ IP: %s         ] ===========", server.address().address);
		logger.info("=========== [ listening on port: %s ] ============", server.address().port );
		logger.info("====================================================");
	});

var	io = require("socket.io").listen(http);
// io.listen(3001);

// Path to our public directory
var pub = __dirname + '/public';

app.use(express.static(pub));
// app.use(express.bodyParser());

/****			*******
**	Rest End Points  **
*****			******/

//
// Change the active mode
//
app.put('/change/mode/:newmode', function(req, resp){
	try{
		var newMode = req.params.newmode;
		logger.info("change mode request received. Changing mode to ["+newMode+"]");
		configs.state.current.mode = newMode;
		resp.send(200);
	} catch(e){
		logger.error("Error while processing request: ", e);
		resp.send(500);
	}
});

//
// Returns the current status as a JSON payload
//
app.get('/current/mode', function(req, resp){
	logger.info("Request for /current/mode");

	try{
		resp.setHeader('Content-Type', 'application/json');
		resp.send(200, {"mode" : configs.state.current.mode});
	}catch(e){
		logger.error("Error while processing request: ", e);
		resp.send(500);
	}
});

/****	   *******
**	Web pages 	**
*****		******/
app.get('/', function(request, response){
	response.sendfile('./public/index.html');
});

app.get('/settings', function(req,rsp){
	rsp.sendfile("./public/settings.html");
});


/****	   *******
**	Socket.io 	**
*****		******/
var statusRefresh = setInterval(
	function(){

		var lightData = [];
		var prmsCollection = [];

		var roomLights = configs.rooms.definitions[0].lights;
		_.each(roomLights, function(v,i){
			var prms = hue.lights.state.get(v).then(function(data){
				lightData.push(data)
			});

			prmsCollection.push(prms);
		});

		when.all(prmsCollection).then(function(){
			io.emit("update room state", lightData);	
		});
		
	},
	5000
);

io.on('connection', function (socket) {
	logger.info("New client connection established");

	
	
    socket.on("set room", function(data,fn){
    	logger.info("set room request received");
    	fn(configs.state.web.rooms.lights);
    });

	socket.on("move light", function (data){
		logger.info("received data on request 'move light': ",data);
		var lites = configs.state.web.rooms.lights;;
		var index = _.find(lites, function(v,i){
			return (v.id == data.id);
		});

		if(index){
			index.x = data.x;
			index.y = data.y;
		}
		socket.emit("update room state", configs.state.web.rooms.lights);
	});

	socket.on("light toggle", function(light,fn){
		hue.lights.toggle(light.id).then(function(){
			fn("ok");
		});
	});

	io.on("get rooms", function(data, fn){
		logger.info("socket request 'get rooms' received");
		console.log(configs.rooms.definitions, arguments);
		fn(configs.rooms.definitions);
	});

	socket.on("get settings", function(d, fn){
		fn(configs);
	});

	socket.on("disconnect", function(){
		console.log("Client dropped");
	});

	socket.on("reconnect", function(){
		console.log("Client reconnected");
	});
});



module.exports = app;