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
console.log(data)
		              local.rooms = data.rooms;

  	            	  // if no room is defined - set the first room as
	        	      // the current
		              if(local.current.room == undefined){
		            	local.current.room = local.rooms[0];
		              	console.log("Defaulting room to first element ["+local.current.room.name+"]");
		              }

		              rooms.setRooms(data.rooms, local.current.room.name);

		              page.emit("join room", 
  			          	{"name":local.current.room.name},
  			          	methods.joinRoomCallback
			           );

                  methods.setupRoomDetails(data.details);

		            } catch(e){
		              console.error(e);
		            }
	          	}
	          );

        	}
        );

        page.on("update room state", function(data){
        	try{
        		console.info("update room state request", data);
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

        page.on("update light state", function(d){
          try{
            rooms.updateLight(d);  
          } catch(e){
            console.error(e);
          }

        page.on("disconnect", function(){
          var $icon = $('.connection-issues');
          console.log("setting up blink")
          if(local.blink == undefined){
            local.blink = setInterval(function(){
            try{
              if($icon.hasClass("hide")){
                $icon.removeClass("hide");
              } else {
                $icon.addClass("hide");
              }
            } catch(e){
              console.error("while blinking", e)
            }
            
          },400);  
          }
          
        });

        page.on("reconnect", function(){
          clearInterval(local.blink);
          local.blink = undefined;
          $('.connection-issues').addClass("hide");
          // page.emit("join room", 
          //         {"name":local.current.room.name},
          //         methods.joinRoomCallback);
        })
          
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
  		},
      setupRoomDetails: function(roomDets){
        var $roomDets = $(".room-details ul");

        _.each(roomDets, function(det,key){

          if(key == "effects"){
            methods.addEffects($roomDets,det);
          }
        });
      },
      addEffects : function($roomDets, fxs){
        var $heading = $(document.createElement("li")),
            $ul = $(document.createElement("ul"));
        console.log("adding fxs [%o]",fxs)

        $heading.addClass("title").text("Effects");
        $ul.addClass("list-unstyled")
            .appendTo($heading);

        $roomDets.append($heading);

        _.each(fxs,function(fx){
          var $li = $(document.createElement("li"));

          $li.text(fx.configs.name);
          $ul.append($li);
        });
        
      }
  	};

	methods.init();
});

