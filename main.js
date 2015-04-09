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
  require("./rooms");
  require("./lights")



}).catch(function(e){
  log.error("Unable to start up service!", e);
  process.exit(1);
});
  

  



