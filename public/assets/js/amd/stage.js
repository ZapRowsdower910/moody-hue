define(["jquery","kinetic"],
	function($){
		
		methods.init();

		return canvas;
	}
);

var canvas = {};
    canvas.cache = {};

var methods = {
	init : function(){

    var box = $('#renderBox');

    if(box.length){
      canvas.stage = new Kinetic.Stage({
        container: "renderBox",
        width: 1170,
        height: 700
      });

      canvas.layer = new Kinetic.Layer();
      canvas.stage.add(canvas.layer);
    }
  }
};