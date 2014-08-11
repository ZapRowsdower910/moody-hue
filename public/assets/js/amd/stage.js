define(["jquery","kinetic"],
	function($){
		
		methods.init();

		return canvas;
	}
);

var canvas = {};

var methods = {
	init : function(){

    var box = $('#renderBox');

    if(box.length){
      canvas.stage = new Kinetic.Stage({
        container: "renderBox",
        width: 850,
        height: 500
      });

      canvas.layer = new Kinetic.Layer();
      canvas.stage.add(canvas.layer);
    }
  }
};