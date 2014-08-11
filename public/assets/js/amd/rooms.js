define(["jquery","underscore","lights","stage"],
	function($,_,Light,canvas){
		var lights = [],
			room;

		var methods = {
			refreshRoom : function(data){
				// console.log("refresh room event received [%o]", data);

				if(data){
					try{

						for(var i = 0;i < lights.length;i++){
						  var thisLight = data[i].state;
						  // console.log(thisLight);

						  var liteObj = lights[i];
						  liteObj.update(thisLight);
						}

						canvas.stage.draw();

					}catch(e){
						console.error(e)
					}
				}
			},
			updatePosition : function(light, currentRoom){

				var lite = _.find(currentRoom.lights,function(l){
					return l.getPositionData().id == light.id;
				});

				lite.reposition(light);

			},
			setRooms : function(data, currentRoom){

	          var $roomMenu = $('.room-menu > ul');
	          $roomMenu.find('li').remove();

	          _.each(data, function(v,i){
	          	var li = document.createElement('li'),
	          		$li = $(li);

	            $li.addClass('pill').data("room", v).text(v.name);
	            if(v.name == currentRoom){
	            	$li.addClass('active');
	            }
	            $roomMenu.append(li);
	          });
	        },
	        /**
	          roomData = [
	            {
	              x: NUM,
	              y: NUM
	            }
	          ]
	        **/
	        setupRoom : function(roomData){
	          console.log("Setting up room", roomData);

	          // Clear the board
	          if(lights.length){
	            var count = lights.length;
	            for(var i = 0; i < count; i++){
	              try{
	                var lite = lights.shift();
	                lite.getKinetic().remove();
	              } catch(e){
	                console.log(e, lights)
	              }
	              
	            }
	          }

	          // Reset it
	          $.each(roomData.lights, function(i, data){
	            console.log("new lite ", data)
	            var lite = new Light(data);
	            lite.getKinetic().position(data);
	            lite.update(data);
	            lights.push(lite);
	          });

	          canvas.stage.draw();

	          return lights;
	        },
	        getLights : function(){
	        	return lights;
	        }
		};

		return methods;
	}
);