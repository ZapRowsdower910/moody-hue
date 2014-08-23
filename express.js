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

app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO}));

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

var roomMonitor = {
	monitors : undefined,
	init: function(socket){
		if(roomMonitor.monitors == undefined){
			roomMonitor.monitors = {};
			
			// _.each(configs.rooms, function(room,index){
			// 	roomMonitor.monitors[room.name] = undefined;
			// });

			var room = utils.findRoom(socket.room),
					cycleDelay = 1000,
					cycleTime = 5000;

			if (room != undefined){
				logger.info("Starting up room refresh monitor for room [%s]", room.name);

				if(roomMonitor.monitors[room.name] == undefined){
					roomMonitor.monitors[room.name] = {};

					_.each(room.lights, function(v,i){
						// logger.info("light [%s] cycling in [%s]", v, , cycleTime);
						setTimeout(function(){
							logger.info("Setuping up light [%s] in [%s]ms", v.id, cycleDelay)
								roomMonitor.monitors[room.name][v.id] = setInterval(function(){
									roomMonitor.cycle.call(roomMonitor, v.id, socket);
								},
								cycleTime);
							},
	  	        cycleDelay += 500);
						
					});

					logger.info("room monitor obj", roomMonitor.monitors)
				}
			} else {
				logger.error("Unable to find room [%s] to setup a state monitor", socket.room);
			}

		}
	},
	cycle : function(lightId, socket){
		var lightData = [],
				prmsCollection = [];

		logger.debug("update cycle for light [%s] for room [%s]",lightId,socket.room);

		hue.lights.state.get(lightId).then(
			function(d){

				var ldata = {
					id : lightId,
					data : d
				};

				socket.broadcast.to(socket.room).emit("update light state", ldata);
		});

	}
};

index.on('connection', function (socket) {
	logger.info("New client connection established on /index");	

    socket.on("join room", function(room,fn){

    	if(roomMonitor.monitors == undefined ||	
    	   (roomMonitor.monitors != undefined &&
    	   roomMonitor.monitors[socket.room] == undefined))
    	{
    		logger.info("Joining room [%s]",room.name);

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

	    	roomMonitor.init(socket);

	    	fn(room);	
    	}

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
			hue.lights.state.get(light.id).then(function(d){
				fn(d);
			});
			// TODO: broadcast toggle event to all clients
			// socket.broadcast.to(socket.room).emit("");
		});
	});

	socket.on("get rooms", function(data, fn){
		logger.info("socket request 'get rooms' received");
		// console.log(configs.rooms, arguments);
		var dets = {
			effects : session.state.plugins.effects,
			services : session.state.plugins.services
		}
		fn({"rooms":configs.rooms, "details":dets});
	});

	socket.on("change bri", function(data,fn){
		logger.info("change bri req", data);

		try{

			hue.lights.state.change(data.id, {"bri":data.bri}).then(
			function(d){
				// TODO: handle err?
				hue.lights.state.get(data.id).then(fn);
			});

		}catch(e){
			logger.error("change bri exception",e)
		}
		
	});

	socket.on("disconnect", function(){
		logger.info("Client dropped");
	});

	socket.on("reconnect", function(){
		logger.info("Client reconnected");
	});

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