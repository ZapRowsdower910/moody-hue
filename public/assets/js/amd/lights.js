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
					shadowEnabled: true,
					id: "light-" + data.id
				});

			// Setup canvas events
			kinetic.on('click tap', function(){menu.show.call(context)});
			kinetic.on('dragstart ', menu.hide);
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
	        	var liteObj = this.getKinetic(),
	        			hue = $(liteObj).data("hue");

		        if(liteData.on && liteData.reachable){
	                var c = hueUtils.xyBriToRgb(liteData.xy[0],
	                                      liteData.xy[1],
	                                      liteData.bri
	                                      );

	                var colorStr = 'rgb('+c.r + ',' + c.g + ',' + c.b + ')';
	                liteObj.strokeEnabled(false);
	                liteObj.fill(colorStr);
	                liteObj.shadowColor(colorStr);
	                liteObj.shadowOpacity(.99);
	                liteObj.shadowBlur(10);
	                // console.log(colorStr);

	                hue.color = liteData;
	                $(liteObj).data("hue", hue);
	            } else {

	                liteObj.strokeEnabled(true);
	                liteObj.fill("#000");
	                liteObj.stroke("red");
	                //liteObj.strokeSize("5")
	            }

	            canvas.stage.draw();
	        },
	        changeBri : function(bri){
	        	console.log("changing lights bri to: ", bri, this );
	        	var dfd = $.Deferred();

	        	// TODO: consider how to do io reject
	        	io("/pages/index").emit("change bri", 
	        		{"id" : this.getPositionData().id, "bri" : bri}, 
	        		function(data){
	        			console.log("got callback from emit", data)
	        			dfd.resolve(data.state);
	        	});

	        	return dfd.promise();
	        }

	    };

		return Light;
	}
);

var menu = {
	
};