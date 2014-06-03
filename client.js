var restify = require("restify");

var endpoint = "http://127.0.0.1:8080";

console.log("creating client to endpoint ["+endpoint+"]");
var client = restify.createClient({
	url : endpoint
});

var path = "/rooms/log/in";

// console.log("sending get request to path ["+path+"]");
// client.get(path, function(err, req, res, obj){
// 	// assert.ifError(err);
// 	console.log(err);
// 	console.log("%j", obj)
// });

client.put(path, function(err, req, res, obj){
	console.log("err ["+err+"]");
	console.log("obj ["+obj+"]");

	req.on('result', function(err, res) {
	    assert.ifError(err);
	    res.body = '';
	    res.setEncoding('utf8');
	    res.on('data', function(chunk) {
	      res.body += chunk;
	    });

	    res.on('end', function() {
	      console.log("resp received [" + res.body + "]");
	    });
	  });

  // req.write('hello world');
  req.end();
});