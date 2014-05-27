var restify = require("restify");
var configs = require("./state"); 
var log4js = require("log4js");
var logger = log4js.getLogger("Rest");

var server = restify.createServer({
    name : "huey-moods"
});

server.pre(restify.pre.sanitizePath());

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

server.put({path:'/change/mode/:newmode', version: '1'} ,function(req, resp, next){
	var newMode = req.params.newmode;
	logger.info("change mode request received. Changing mode to ["+newMode+"]");
	configs.state.current.mode = newMode;
	return next();
});

// Start rest server
server.listen(configs.server.port, configs.server.ip_addr, function(){
	logger.info("====================================================");
	logger.info("=========== [ Starting up REST service ] ===========");
    logger.info("=========== [ App %s           ] ===========", server.name);
	logger.info("=========== [ listening at %s ] ======", server.url );
	logger.info("====================================================");
});

module.exports = server;