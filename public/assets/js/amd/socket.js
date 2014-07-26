define(["socket.io", "configs"],
	function(io, configs){
		
		socket = io.connect(document.domain);

		return socket;
	}
);