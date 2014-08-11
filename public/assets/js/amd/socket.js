define(["socket.io", "configs"],
	function(io, configs){
		
		var socket = io.connect(document.domain);

		return socket;
	}
);