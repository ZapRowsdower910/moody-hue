// Node Modules
var express = require("express"),
	_ = require("underscore"),
	when = require("when"),
	log4js = require("log4js"),

	logger = log4js.getLogger("Express");

// Local Modules
var hue = require("./hue-api"),
	session = require("./session"),
	extend = require("./extend"),
	configManager = require("./configManager"),
	configs;

// Local vars
var app = express(),
	http = require("http").createServer(app),
	io = require("socket.io").listen(http);

// Path to our public directory
var pub = __dirname + '/public';

app.use(express.static(pub));
// app.use(express.bodyParser());

// Custom methods
app.hueInit = function(conf){
	configs = conf;

	server = http.listen(configs.server.port, configs.server.ip_addr, function(){
		logger.info("====================================================");
		logger.info("=========== [ Starting up Web service ] ============");
	    logger.info("=========== [ IP: %s         ] ===========", server.address().address);
		logger.info("=========== [ listening on port: %s ] ============", server.address().port );
		logger.info("====================================================");
	});
};


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
		session.state.current.mode = newMode;
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
		resp.send(200, {"mode" : session.state.current.mode});
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

//
// pages/index
//
var index = io.of("/pages/index");

index.on('connection', function (socket) {
	logger.info("New client connection established on /index");

    socket.on("join room", function(room,fn){
    	logger.info("join room request received. Joining room: ",room.name);

    	var room = _.find(configs.rooms, function(v,i){
    		return v.name == room.name;
    	});

    	// if were in a room - leave it
    	if(socket.room){
    		socket.leave(socket.room);	
    	}
    	
    	// Join room
    	socket.join(room.name);
    	// Set sockets room
    	socket.room = room.name;
    	fn(room);
    });

	socket.on("move light", function (data){
		logger.info("received data on request 'move light': ",data);

		if(data){
			var room = utils.findRoom(socket.room);

			var index = _.find(room.lights, function(v,i){
				return (v.id == data.id);
			});

			if(index){
				index.x = data.x;
				index.y = data.y;

				logger.info("Rooms: ",JSON.stringify(configs.rooms));

				configManager.scheduler.save(configs);

				socket.broadcast.to(socket.room).emit("update light position", index);
			}
		}
	});

	socket.on("light toggle", function(light,fn){
		hue.lights.toggle(light.id).then(function(state){
			// fn(state);
			// TODO: broadcast toggle event to all clients
			// socket.broadcast.to(socket.room).emit("");
		});
	});

	socket.on("get rooms", function(data, fn){
		logger.info("socket request 'get rooms' received");
		// console.log(configs.rooms, arguments);
		fn(configs.rooms);
	});

	socket.on("change bri", function(data,fn){
		logger.info("change bri req", data);

		hue.lights.state.change(data.id, {"bri":data.bri}).then(fn)
	});

	socket.on("disconnect", function(){
		logger.info("Client dropped");
	});

	socket.on("reconnect", function(){
		logger.info("Client reconnected");
	});

	var statusRefresh = setInterval(
		function(){

			var lightData = [];
			var prmsCollection = [];

			var room = utils.findRoom(socket.room);
			_.each(room.lights, function(v,i){
				var prms = hue.lights.state.get(v.id).then(function(data){
					lightData.push(data)
				});

				prmsCollection.push(prms);
			});

			when.all(prmsCollection).then(function(){
				// logger.info("Emitting update room state", lightData, room);
				socket.broadcast.to(socket.room).emit("update room state", lightData);	
			});
			
		},
		5000
	);
});


//
//	pages/settings
//
var settings = io.of("/pages/settings");
settings.on("connection", function(socket){
	logger.info("Client connected to /settings");

	socket.emit("load configs", configs);
});

module.exports = app;