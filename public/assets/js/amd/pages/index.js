define(["jquery", "socket.io","stage","rooms"], function($, io, canvas, rooms){

		var local = {
			current : {},

		};
		var page = io("/pages/index");

		page.on("connect", function(){

	          console.log("Connection established with server");

	          // page.on("update room", function(roomData){
	          // 	console.log("update room request received", roomData)
	          // 	rooms.setupRoom(roomData);
	          // 	console.log(local.current.room.lights)
	          // });

	          page.emit("get rooms", {}, 
	          	function(data){
		            try{

		              local.rooms = data;

  	            	  // if no room is defined - set the first room as
	        	      // the current
		              if(local.current.room == undefined){
		            	local.current.room = local.rooms[0];
		              	console.log("Defaulting room to first element ["+local.current.room.name+"]");
		              }

		              rooms.setRooms(data, local.current.room.name);

		              page.emit("join room", 
			          	{"name":local.current.room.name},
			          	methods.joinRoomCallback
			          );
		            } catch(e){
		              console.error(e);
		            }
	          	}
	          );

        	}
        );

        page.on("update room state", function(data){
        	try{
        		// console.info("update room state request", data);
        		rooms.refreshRoom(data);
        	} catch(e){
        		console.log("update room state error", e);
        	}
        });

        page.on("update light position", function(light){
        	try{
        		console.info("update light position request", light);
        		rooms.updatePosition(light, local.current.room);
        	} catch(e){
        		console.log(e);
        	}
        });

    var methods = {
		init : function(){
			$('.room-menu').on("click", "li", function(){
		    	var $this = $(this),
		    		thisRoom = $this.data("room");

		    	$this.addClass("pending");
				page.emit("join room", 
					{"name":thisRoom.name},
					methods.joinRoomCallback
				);
		    });
		},
		joinRoomCallback : function(roomData){
			try{
				console.log("Successfully joined room [%s]",local.current.room.name);
		    	local.current.room.lights = rooms.setupRoom(roomData);

		    	var $pending = $('.pending');
		    	if($pending.length){
		    		$('.active').removeClass("active");
		    		$pending.addClass('active').removeClass('pending');
		    	}
			} catch(e){
				console.error("exception on joinRoomCallback",e);
			}
		}
	};

	methods.init();
});

