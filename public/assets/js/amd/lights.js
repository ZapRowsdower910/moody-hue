define(["jquery","hueUtils","socket.io","stage","lightMenu"],
	function($,hueUtils,io,canvas,menu){
		function Light(data){
			// console.log("data in lite constructor",data)

			var positional = data,
				context = this,
				color,
				kinetic = new Kinetic.Circle({
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

			// Setup canvas events
			kinetic.on('click', function(){menu.show.call(context)});
			kinetic.on('dragstart', menu.hide);
			kinetic.on('dragend', this.moveLight);
			// Store data
			$(kinetic).data("hue",{"id":data.id, "positional":positional, "color":color})
			// Add to canvas
			canvas.layer.add(kinetic);

			this.getKinetic = function(){return kinetic;};
			this.getPositionData = function(){return positional;};
			this.getColorData = function(){return color;};
		};

		Light.prototype = {
	        moveLight : function(e){

	          var hue = $(e.target).data("hue");
	          // console.log(hue);
	          io("/pages/index").emit("move light",
	                        {"id":hue.id,
	                          "x":e.target.attrs.x,
	                          "y":e.target.attrs.y
	                        });
	        },
	        turnOff : function(){
	            
	        },
	        reposition : function(positionData){
	        	console.log("respoitioning node",positionData);

	        	this.getKinetic().setX(positionData.x);
	        	this.getKinetic().setY(positionData.y);

	        	this.getKinetic().getLayer().draw();
	        },
	        update : function(liteData){
		        if(liteData.on && liteData.reachable){
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
	                hue.color = liteData;
	                $(liteObj).data("hue", hue);
	            } else {
	            	var liteObj = this.getKinetic();

	                liteObj.strokeEnabled(true);
	                liteObj.fill("#000");
	                liteObj.stroke("red");
	                //liteObj.strokeSize("5")
	            }
	        },
	        changeBri : function(bri){
	        	console.log("changing lights bri to: ", bri, this );

	        	io("/pages/index").emit("change bri", {"id" : this.getPositionData().id, "bri" : bri});
	        }

	    };

		return Light;
	}
);

var menu = {
	
};