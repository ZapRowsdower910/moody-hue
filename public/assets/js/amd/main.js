define(["jquery","socket","stage","rooms"],
	function($, socket, canvas, rooms){
		
		socket.on("connect", 
			function(){
	          console.log("Connection established with server");

	          socket.emit("set room", 
	          	{}, 
	          	function(roomData){
	            	rooms.setupRoom(roomData);
	          	}
	          );

	          socket.on("update room", function(roomData){
	          	console.log("update room request received", roomData)
	          	rooms.setupRoom(roomData);
	          });

	          socket.emit("get rooms", 
	          	{},
	          	function(data){
		            try{
		              rooms.setRooms(data);
		            } catch(e){
		              console.error(e);
		            }
	          	}
	          );

        	}
        );

        socket.on("update room state", function(data){
        	rooms.refreshRoom(data);
        });
	}
);