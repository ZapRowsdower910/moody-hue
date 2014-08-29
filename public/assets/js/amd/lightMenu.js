define(["jquery","hueUtils","socket.io","stage"], 
	function($,hueUtils,io,canvas){
	
		var methods = {
			cache : {
					lite : undefined,
					groups : {}
			},
  		init : function(){
  			methods.cache = {};
  			methods.cache.groups = {};

  			canvas.cache.dragBox = new Kinetic.Rect({
  				id:"dragBox",
  				height: "580",
  				width: "730",
  				x:"55",
  				y:"55",
  				stroke:"green",
  				strokeWidth:"1",
  				visible:false
  			});

  			canvas.cache.dragLimits = {
					height: 30,
					minX: canvas.cache.dragBox.getX(),
					maxX: canvas.cache.dragBox.getX() + canvas.cache.dragBox.getWidth() - 20,
					minY: canvas.cache.dragBox.getY(),
					maxY: canvas.cache.dragBox.getY() + canvas.cache.dragBox.getHeight() - 20
				};

  			canvas.layer.add(canvas.cache.dragBox);

				methods.badge.build();
				methods.level.build(200,200);

				canvas.frame = new Kinetic.Layer();
				canvas.stage.add(canvas.frame);

  			// var g = methods.cache.group = new Kinetic.Group();
  			// g.add(badge);
  			// g.add(level);

  			var poly = new Kinetic.Line({
	        points : [0,30, 30,0, 300,0, 330,25, 270,25, 250,10, 200,10, 180,20, 120,20, 100,10, 60,10, 25,50, 25,120, 10,140, 10,250, 0,270],
	        fill : "rgba(255,255,255,.05)",
	        stroke: 'rgba(255,255,255,1)',
	        strokeWidth: 2,
	        closed: true,
	        id:"topLeft",
	        shadowColor : "#fff",
				  shadowBlur : 15
	      });

  			var poly2 = new Kinetic.Line({
	        points : [0,580, 25,555, 25,610, 15,625, 15,670, 30,680, 70,680, 80,670, 130,670, 145,680, 180,680, 200,660, 260,660, 280,680, 380,680, 360,690, 280,690, 260,670, 200,670, 180,690, 30,690, 0,670],
	        fill : "rgba(255,255,255,.05)",
	        stroke: 'rgba(255,255,255,1)',
	        strokeWidth: 2,
	        closed: true,
	        id:"bottomLeft",
	        shadowColor : "#fff",
				  shadowBlur : 15
	      });

  			var poly3 = new Kinetic.Line({
	        points : [680,690, 700,670, 750,670, 770,680, 810,680, 840,660, 840,600, 820,580, 820,540, 850,520, 850,660, 810,690],
	        fill : "rgba(255,255,255,.05)",
	        stroke: 'rgba(255,255,255,1)',
	        strokeWidth: 2,
	        closed: true,
	        id:"bottomRight",
	        shadowColor : "#fff",
				  shadowBlur : 15
	      });

  			var poly4 = new Kinetic.Line({
	        points : [600,0, 620,25, 650,25, 680,10, 700,10, 780,10, 800,30, 800,100, 820,120, 820,170, 840,190, 840,260, 820,280, 820,320, 850,300, 850,30, 820,0],
	        fill : "rgba(255,255,255,.05)",
	        stroke: 'rgba(255,255,255,1)',
	        strokeWidth: 2,
	        closed: true,
	        id:"topRight",
	        shadowColor : "#fff",
				  shadowBlur : 15
	      });

	//       var svg = new Kinetic.Path({
	//       	fill:"rgba(255,255,255,.2)",
	//       	data:"232.2,3 204,34 141.2,34 
	// 122,15 39.5,15 15,38 15,71.7 30,87 30,119.2 17,132 17,203.2 40,226 40,259.5 2.2,284.2 2.9,31.2 33.8,3",
	// 				x:70,
	// 				y:70,
	// 				scale:{x:2,y:2}
	//       });

  			var frameGroup = new Kinetic.Group();
  			frameGroup.add(poly);
  			frameGroup.add(poly2);
  			frameGroup.add(poly3);
  			frameGroup.add(poly4);
  			// frameGroup.add(svg);

  			canvas.frame.add(frameGroup);

  			staticAnim = new Kinetic.Animation(function(frame) {
 					var gened = (frame.lastTime * frame.frameRate);

					if (frame.time > 1500) {
          	staticAnim.stop();
          	frameGroup.show();
          } else {
	 					if((gened % 2) > 1){
	 						frameGroup.show();
	 					} else {
	 						frameGroup.hide();
	 					}
          }

          canvas.frame.draw();
     			
        }, canvas.frame);

        
        staticAnim.start();

  			canvas.frame.draw();


	     //      var bump = poly.fillLinearGradientStartPoint().y + 5;
	     //      if(bump > 400){
	     //      	bump = 0;
	     //      }
	     //      poly.fillLinearGradientStartPoint({x : 0, y : bump});
	     //      poly.fillLinearGradientEndPoint({x:0, y:bump + 400});
      },
      badge : {
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
					  y: y,
					  shadowEnabled :true,
					  shadowColor : "#fff",
					  shadowBlur : 5,
					  shadowOpacity : '.9'
					});

					accent1 = new Kinetic.Arc({
					  innerRadius: 19,
					  outerRadius: 21,
					  fill: 'white',
					  opacity : '.35',
					  angle: 160,
					  rotationDeg: 180,
					  x: x,
					  y: y,
					  shadowColor : "#fff",
					  shadowBlur : 10
					});

					accent2 = new Kinetic.Arc({
					  innerRadius: 23,
					  outerRadius: 26,
					  fill: 'white',
					  opacity : '.55',
					  angle: 200,
					  rotationDeg: 80,
					  x: x,
					  y: y,
					  shadowColor : "#fff",
					  shadowBlur : 10
					});

					accent3 = new Kinetic.Arc({
					  innerRadius: 29,
					  outerRadius: 32,
					  fill: 'white',
					  opacity : '.3',
					  angle: 250,
					  rotationDeg: 180,
					  x: x,
					  y: y,
					  shadowColor : "#fff",
					  shadowBlur : 10
					});

					accent4 = new Kinetic.Arc({
					  innerRadius: 35,
					  outerRadius: 37,
					  fill: 'white',
					  opacity : '.5',
					  angle: 230,
					  rotationDeg: 140,
					  x: x,
					  y: y,
					  shadowColor : "#fff",
					  shadowBlur : 10
					});

					accent5 = new Kinetic.Arc({
					  innerRadius: 39,
					  outerRadius: 42,
					  fill: 'white',
					  opacity : '.2',
					  angle: 180,
					  rotationDeg: 120,
					  x: x,
					  y: y,
					  shadowColor : "#fff",
					  shadowBlur : 10
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
						x: (x - 25),
						y: (y - 26),
						text: "",
						fontSize: 16,
						fontStyle : "bold",
						fontFamily: 'elektora',
						fill: 'black',
						rotation : -28,
						id: "lightId"
					});

					accent1.cache();
					accent2.cache();
					accent3.cache();
					accent4.cache();
					accent5.cache();

					console.log("building menu")

	        methods.cache.anim = new Kinetic.Animation(function(frame) {
	          accent1.rotate(frame.timeDiff * ((360 / 3) / 1000));
	          accent2.rotate(frame.timeDiff * ((360 / -4) / 1000));
	          accent3.rotate(frame.timeDiff * ((360 / -11) / 1000));
	          accent4.rotate(frame.timeDiff * ((360 / 4) / 1000));
	          // accent5.rotate(frame.timeDiff * ((360 / -3) / 1000));
	        }, canvas.layer);

	        
	        methods.cache.groups.badge = new Kinetic.Group();
	        methods.cache.groups.badge.add(base);
	        methods.cache.groups.badge.add(accent1);
	        methods.cache.groups.badge.add(accent2);
	        methods.cache.groups.badge.add(accent3);
	        methods.cache.groups.badge.add(accent4);
	        // methods.cache.groups.badge.add(accent5);
	        methods.cache.groups.badge.add(idBadge);
	        methods.cache.groups.badge.add(id);

	        canvas.layer.add(methods.cache.groups.badge);

	        methods.cache.groups.badge.hide();

					$(".light-menu").on("click",'li', function(e){
						var $this = $(this),
							current = $(e.delegateTarget).data('active');
							
						methods.toggle(io,current,$this);
					});

					return methods.cache.groups.badge;
      	},
      	position : function(x,y,hue){
      		// position badge
      		methods.cache.groups.badge.setX(x);
					methods.cache.groups.badge.setY(y);
	        		// Set light Id text
					var id = methods.cache.groups.badge.find('#lightId');
					id[0].setText(hue.id);

					methods.cache.groups.badge.show();
      	}
      },
      level : {
      	build : function(lite){
      		var shape,
	      			fill,
	      			handle,
        			x = y = 0;

      		shape = new Kinetic.Rect({
					  strokeEnabled: true,
					  stroke: 'white',
					  strokeWidth: '3',
					  strokeAlpha: '400',
					  // fill: 'white',
					  opacity : '1',
					  width : 25,
					  height: 100,
					  x: x,
					  y: y,
					  id : "level-outline",
					  shadowColor : "#fff",
					  shadowBlur : 10
					});

      		fill = new Kinetic.Rect({
					  strokeEnabled: false,
					  fill: 'white',
					  opacity : '.5',
					  width : 25,
					  height: 0,
					  x: x,
					  y: y,
					  id : "level-fill"
					});

	      //   		handle = new Kinetic.Rect({
	      //   		  strokeEnabled: false,
					  // fill: 'white',
					  // opacity : '1',
					  // width : 25,
					  // height : 5,
	      //   		  x: x,
					  // y: y,
					  // id : "level-handle"
	      //   		});

					shape.on('click', function(e){
						var mouse = canvas.stage.getPointerPosition(),
							rPos = e.target.getAbsoluteTransform().copy().invert().point(mouse),
							percent = (100 - rPos.y),
							bri = Math.ceil(percent * 2.55);

					    console.log(percent, bri);
					    var prms = methods.cache.light.changeBri(bri);

					    prms.then(function(hueData){
					    	// console.log("change bri callback dfd resolved",hueData)
					    	methods.level.position(fill.getX(),fill.getY(),hueData);
					    });
					});

					methods.cache.groups.level = new Kinetic.Group();
					// methods.cache.groups.level.add(handle);
					methods.cache.groups.level.add(fill);
					methods.cache.groups.level.add(shape);

					methods.cache.groups.level.hide();

					canvas.layer.add(methods.cache.groups.level);
					canvas.layer.draw();

					return methods.cache.groups.level;
      	},
      	position : function(x,y,hue){
      		try{
      			console.log(arguments)
      			var bri = hue ? hue.bri : 0,
      				h = (bri / 2.55),
        			offset = (100 - h),
        			fill = methods.cache.groups.level.find("#level-fill");

	        		console.log("bri is:", bri, h, offset)

	        		methods.cache.groups.level.setX(x - 90);
	        		methods.cache.groups.level.setY(y - 50);

	        		fill.setHeight(h);
	        		fill.position({y:offset});

		        		// handle.position({y:offset})
console.log("isVisible: ", methods.cache.groups.level.isVisible())

	        		if(!methods.cache.groups.level.isVisible()){
	        			methods.cache.groups.level.show();
	        		}
        		}catch(e){
        			console.log("exception while positioning",e);
        		}
        	}
        },
	        	
      	show : function(){
      		var lite = this.getKinetic(),
        			x = lite.attrs.x,
							y = lite.attrs.y,
							hue = $(lite).data("hue");

						// Set current light
						methods.cache.light = this;

						$('.pill.on').text(( hue.color && hue.color.on) ? "Turn Off" : "Turn On");

						$('.light-menu').css({'top':(y - 40)+'px', 'left': (x + 55) + "px"}).fadeIn();

						$(".light-menu").data("active", lite);

						methods.badge.position(x,y,hue);
						methods.level.position(x,y,hue.color);
						
						// methods.cache.groups.level.show();
						
						methods.cache.anim.start();

						canvas.stage.draw();
      	},
      	hide : function(){
      		$('.light-menu').fadeOut();

      		// If the menu has been built we should attempt
      		// to hide it
      		if(methods.cache){
      			methods.cache.groups.badge.hide();
      			methods.cache.groups.level.hide();
      			methods.cache.anim.stop();	
      		}
      	},
      	toggle : function(io,kinetic,$this){
					var hue = $(kinetic).data("hue");
	        
	        io("/pages/index").emit("light toggle", 
	          {id : hue.id},
	          function(state){
	            console.log("lite toggle callback",state);
	            try{
	              kinetic.stroke("red");
	              kinetic.strokeWidth(2);
	              canvas.stage.draw();

	              $this.text("Turn " + (state ? "Off" : "On"));

	            } catch(e){
	              logger.error(e);
	            }
	            
	          }
        	);
				}
		};

		methods.init();

		return methods;
	}
);