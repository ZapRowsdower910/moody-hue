var restify = require("restify");
var configs = require("./state"); 
var log4js = require("log4js");
var logger = log4js.getLogger("Rest");

try{
	var server = restify.createServer({
	    name : "huey-moods"
	});

	server.pre(restify.pre.sanitizePath());

	server.use(restify.queryParser());
	server.use(restify.bodyParser());
} catch(e){
	logger.error("Error while attempting to start rest service");
}

// server.accepts("application/json");

/****
* Change the active mode
****/
server.put({path:'/change/mode/:newmode', version: '1'} ,function(req, resp, next){
	var newMode = req.params.newmode;
	logger.info("change mode request received. Changing mode to ["+newMode+"]");
	session.state.current.mode = newMode;
	return next();
});

/**
* Returns the current status as a JSON payload
**/
server.get({path:'/current/mode'}, function(req, resp, next){
	logger.info("Request for /current/mode");

	try{
		resp.setHeader('Content-Type', 'application/json');
		resp.send(200, {"mode" : session.state.current.mode});
	}catch(e){
		logger.error("Error while processing request: ", e);
		resp.send(500);
	}

	return next();
});

module.exports = server;