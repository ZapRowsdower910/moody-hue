requirejs.config({
  baseUrl : "/assets/js/amd",
  paths : {
    'socket.io' : "//cdn.socket.io/socket.io-1.0.6",
    'underscore' : "//underscorejs.org/underscore-min",
    'kinetic' : "/assets/js/kinetic",
    'bootstrap' : "/assets/js/bootstrap.min",
    'jquery' : "//code.jquery.com/jquery-1.11.0.min"
  }
});

require(["main"]);