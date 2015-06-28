var express = require('express'),
    path = require('path'),
    // cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    // session = require('express-session');
    log4js = require("log4js"),
    log = log4js.getLogger("Server");

var app = express(),
    configManager = require("./configManager"),
    baseApiRoute = require("./web/routes/baseApi"),
    generalConfigs;

// Use template engine swig

// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(log4js.connectLogger(log, { level: log4js.levels.INFO }));

// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("web/public"));
// app.use(session({
//     secret : "SHUUUUSH",
//     saveUninitialized: true,
//     resave : false
// }));


// // ROUTES FOR OUR API
// // =============================================================================
// var router = express.Router();              // get an instance of the express Router

// // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function(req, res) {
//     res.json({ message: 'hooray! welcome to our api!' });   
// });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', baseApiRoute);


configManager.getGeneral().then(function(conf){
  generalConfigs = conf;
  log.info("Attempting to startup express using general config:", conf)

  // START THE SERVER
  // =============================================================================
  var instance = app.listen(generalConfigs.server.port, generalConfigs.server.ip, function(){
    log.info("====================================================");
    log.info("=========== [ Starting up Web service ] ============");
    log.info("=========== [ IP: %s         ] ===========", instance.address().address);
    log.info("=========== [ listening on port: %s ] ============", instance.address().port );
    log.info("====================================================");
  });


}).catch(function(e){
  log.error("Failed to get general configs",e);
})


// app.get("/", function(req,res){
//   res.send("")
// });


// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// // development error handler
// // will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// // production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });

module.exports = app;