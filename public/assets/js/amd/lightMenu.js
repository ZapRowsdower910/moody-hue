define([],
	function(){
		show : function(light){
          var x = light.attrs.x;
          var y = light.attrs.y;

          var conf = $(light).data("conf");
          $('.pill.on').text(conf.data.on ? "Turn Off" : "Turn On");

          $('.light-menu').css({'top':(y - 20)+'px', 'left': (x + 20) + "px"}).fadeIn();

          $(".light-menu").data("active", light);
        },
        hide : function(){
          $('.light-menu').fadeOut();
        }
	}
);