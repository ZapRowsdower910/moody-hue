var log4js = require("log4js"),
    log, db;

var configManager = require("./configManager");
    

log4js.configure({
  appenders: [
    { type: "console" }
  ],
  replaceConsole : true
});

log = log4js.getLogger("Main");
log.info("Logger initialized");


configManager.init().then(function(conf){
  log.debug("General configs have been found:", conf);

  // Startup the express server
  server = require("./server");
  // load apis
  require("./web/routes/roomsApi");
  require("./web/routes/lightsApi")



}).catch(function(e){

  if(e.name == 'MongoError'){

    if(e.message == 'connect ETIMEDOUT'){
      log.error("Looks like a timeout occurred with mongo. This services is unable to start without mongo. Check your mongo settings in configs.json");
    } else {
      log.error("Unknow MongoError preventing service from starting!", e);
    }

  } else {
    log.error("Unable to start up service!", e);  
  }

  process.exit(1);
});
  

  



