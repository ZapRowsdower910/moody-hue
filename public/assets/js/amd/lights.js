define(["jquery","hueUtils","socket","stage"],
	function($,hueUtils,socket,canvas){
		function Light(data){
			console.log("data in lite constructor",data)
			var lite = new Kinetic.Circle({
				radius: 10,
				fill: '#0065ff',
				draggable: true,
				x : 100,
				y : 100,
				shadowColor:'#0065ff',
				shadowBlur: 25,
				shadowOffset: {x:0,y:0},
				shadowOpacity: 1,
				shadowEnabled: true
			});

			var context = this;
			// Setup canvas events
			lite.on('click', function(){context.menu.show.apply(context)});
			lite.on('dragstart', this.menu.hide);
			lite.on('dragend', this.moveLight);
			// Store data
			$(lite).data("hue",{"id":data.id, "data":data})
			// Add to canvas
			canvas.layer.add(lite);
			
			this.getKinetic = function(){return lite;}
			this.getPositionData = function(){return data;}
		};

		Light.prototype = {
	        moveLight : function(e){

	          var hue = $(e.target).data("hue");
	          // console.log(hue);
	          socket.emit("move light",
	                        {"id":hue.id,
	                          "x":e.target.attrs.x,
	                          "y":e.target.attrs.y
	                        });
	        },
	        turnOff : function(){
	            var light = $(".light-menu").data("active");
	            console.log("active stored in menu: ", light);
	            var active = $(light).data("hue");
	            socket.emit("light toggle", 
	              {id : active.id},
	              function(){
	                console.log("lite toggle callback");
	                try{
	                  active.stroke("red");
	                  active.strokeWidth(10);
	                  canvas.stage.draw();  
	                } catch(e){
	                  logger.error(e);
	                }
	                
	              }
	            );
	        },
	        reposition : function(positionData){
	        	var liteObj = this.getKinetic();

	        	console.log(arguments, liteObj)

	        	liteObj.move({
	        		x : positionData.x,
	        		y : positionData.y
	        	})
	        },
	        update : function(liteData){
		        if(liteData.on){
	                var c = hueUtils.xyBriToRgb(liteData.xy[0],
	                                      liteData.xy[1],
	                                      liteData.bri
	                                      );
	                
	                var liteObj = this.getKinetic();

	                var colorStr = 'rgb('+c.r + ',' + c.g + ',' + c.b + ')';
	                liteObj.strokeEnabled(false);
	                liteObj.fill(colorStr);
	                liteObj.shadowColor(colorStr);
	                liteObj.shadowOpacity(.99);
	                liteObj.shadowBlur(10);
	                // console.log(colorStr);

	                var hue = $(liteObj).data("hue");
	                hue.data = liteData;
	                $(liteObj).data("hue", hue);
	            } else {
	            	var liteObj = this.getKinetic();

	                liteObj.strokeEnabled(true);
	                liteObj.fill("#000");
	                liteObj.stroke("red");
	                //liteObj.strokeSize("5")
	            }
	        },
	        menu : {
	        	build : function(){
	        		var x = 0,
	        			y = 0,
	        			base, accent1, accent2,
	        			accent3, accent4, accent5,
	        			id, idBadge;

	        		base = new Kinetic.Arc({
					  innerRadius: 15,
					  outerRadius: 18,
					  fill: 'white',
					  opacity : '.9',
					  angle: 360,
					  rotationDeg: 80,
					  x: x,
					  y: y
					});

					accent1 = new Kinetic.Arc({
					  innerRadius: 19,
					  outerRadius: 21,
					  fill: 'white',
					  opacity : '.35',
					  angle: 160,
					  rotationDeg: 180,
					  x: x,
					  y: y
					});

					accent2 = new Kinetic.Arc({
					  innerRadius: 23,
					  outerRadius: 26,
					  fill: 'white',
					  opacity : '.55',
					  angle: 200,
					  rotationDeg: 80,
					  x: x,
					  y: y
					});

					accent3 = new Kinetic.Arc({
					  innerRadius: 29,
					  outerRadius: 32,
					  fill: 'white',
					  opacity : '.3',
					  angle: 250,
					  rotationDeg: 180,
					  x: x,
					  y: y
					});

					accent4 = new Kinetic.Arc({
					  innerRadius: 35,
					  outerRadius: 37,
					  fill: 'white',
					  opacity : '.5',
					  angle: 230,
					  rotationDeg: 140,
					  x: x,
					  y: y
					});

					accent5 = new Kinetic.Arc({
					  innerRadius: 39,
					  outerRadius: 42,
					  fill: 'white',
					  opacity : '.2',
					  angle: 180,
					  rotationDeg: 120,
					  x: x,
					  y: y
					});

					idBadge = new Kinetic.Arc({
					  strokeEnabled: true,
					  stroke: 'grey',
					  strokeWidth: '3',
					  strokeAlpha: '400',
					  innerRadius: 16,
					  outerRadius: 40,
					  fill: 'white',
					  opacity : '.9',
					  angle: 80,
					  rotationDeg: 200,
					  x: x,
					  y: y
					});

					id = new Kinetic.Text({
						x: (x - 26),
						y: (y - 37),
						text: hue.id,
						fontSize: 30,
						fontStyle : "bold",
						fontFamily: 'space',
						fill: 'black',
						rotation : -28,
						id: "lightId"
					});

					console.log("building menu")

					canvas.menu = {};

			        canvas.menu.anim = new Kinetic.Animation(function(frame) {
			          accent1.rotate(frame.timeDiff * ((360 / 2) / 1000));
			          accent2.rotate(frame.timeDiff * ((360 / -4) / 1000));
			          accent3.rotate(frame.timeDiff * ((360 / -10) / 1000));
			          accent4.rotate(frame.timeDiff * ((360 / 6) / 1000));
			          accent5.rotate(frame.timeDiff * ((360 / -2) / 1000));
			        }, canvas.layer);

			        
			        canvas.menu.group = new Kinetic.Group();
			        canvas.menu.group.add(base);
			        canvas.menu.group.add(accent1);
			        canvas.menu.group.add(accent2);
			        canvas.menu.group.add(accent3);
			        canvas.menu.group.add(accent4);
			        canvas.menu.group.add(accent5);
			        canvas.menu.group.add(idBadge);
			        canvas.menu.group.add(id);

			        canvas.layer.add(canvas.menu.group);

			        canvas.menu.group.hide();

					// canvas.layer.add(base);
					// canvas.layer.add(accent1);
					// canvas.layer.add(accent2);
					// canvas.layer.add(accent3);
					// canvas.layer.add(accent4);
					// canvas.layer.add(accent5);
					// canvas.layer.add(idBadge);
					// canvas.layer.add(id);
					// canvas.stage.draw();
	        	},
	        	
	        	show : function(){
	        		var lite = this.getKinetic();
	        			x = lite.attrs.x,
						y = lite.attrs.y,
						hue = $(lite).data("hue");

					$('.pill.on').text(hue.data.on ? "Turn Off" : "Turn On");

					$('.light-menu').css({'top':(y - 40)+'px', 'left': (x + 55) + "px"}).fadeIn();

					$(".light-menu").data("active", lite);

					if(canvas.menu == undefined){
						this.menu.build();
					}

					canvas.menu.group.setX(x);
					canvas.menu.group.setY(y);
					canvas.menu.group.show();
					var id = canvas.menu.group.find('#lightId');
					console.log(id[0])
					id[0].setText(hue.id);
					
					canvas.menu.anim.start();

					canvas.stage.draw();
					
	        	},
	        	hide : function(){
	        		$('.light-menu').fadeOut();

	        		// If the menu has been built we should attempt
	        		// to hide it
	        		if(canvas.menu){
	        			canvas.menu.group.hide();
	        			canvas.menu.anim.stop();	
	        		}
	        	}
	        }
	    };

		return Light;
	}
);

var menu = {

}