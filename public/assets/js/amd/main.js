define(["jquery","socket","stage","rooms"],
	function($, socket, canvas, rooms){

		var page = $('script[data-page]').data('page');
		if(page){
			console.log("Loading page script: " + page);
			require(["/assets/js/amd/pages/" + page + ".js"]);
		}
		
	}
);