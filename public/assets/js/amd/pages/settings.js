define(["underscore","socket.io"],
	function(_,io){

		var local = {};

		var methods = {
			init : function(){
				local.cnt = $('.main-cnt');
				local.patientZero = local.cnt.find(".conf-block.patient-zero").detach();
			},

		};

		methods.init();

		var page = io("/pages/settings");
		page.on("connect", function(){
			console.log("connected to server /pages/settings");

			page.on("load configs", function(conf){
				console.log("/load configs req received", conf);

				_.each(conf, function(row,name){
					console.log(name,row);
					var $el = $(local.patientZero).clone().removeClass("hide patient-zero");
					$el.find("h3").text(name);
					var $li = $el.find("li");
					local.cnt.append($el);

					_.each(row, function(v,k){
						console.log("Argument duuump", arguments);
						console.info(typeof v);
						if(typeof v == 'object'){
							_.each(v,function(h,j){
								console.log(h,j, typeof h)
								if(typeof h != 'object'){
									var $row = $li.clone();
									
									var $input = $(document.createElement("input"));
									$input.attr('name', j);
									$input.attr("value", h);
									$input.attr("type","text");

									$row.find("label").text(j).after($input);
									$li.after($row);
								}
							});
							// for(props in v){
							// 	console.warn(v[props])
							// }
						}
					});
				});
			});
		});
	}
);