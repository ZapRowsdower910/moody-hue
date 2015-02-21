angular.module("Directives")
	.directive("lights", ["Hue", function(Hue){
		var control = function($scope){

			$scope.lights = {
				turnOn : function(id){
					Hue.lights.turnOn(id).catch(function(d){
						console.log("turn on failed", d);


					});
				},
				turnOff : function(id){
					Hue.lights.turnOff(id);
				},
				colorChange : function(id,c){
					console.log(id, c)
					console.log($scope.roomlights[0]);
				}
			};


			$scope
			$scope.lights

		};
		var linker = function(scope, el, attr){
			var toggles = el.children('.btn-group').children('.toggle-state');
			console.log(typeof scope.roomlights)

			scope.$watch(
				function(){return scope.roomlights;}, 
	          	function(newVal, oldVal){
console.log(newVal, oldVal)
	          		if(newVal){

						scope.roomlights.each(function(l){
							console.log(l)
							Hue.lights.getState(l.id).then(function(d){
								console.log("lite ["+l.id+"] state", d.state.on);
								l.current = d;

								if(d.state.on){
									l.stateToggle = true;
								} else {
									l.stateToggle = false;
								}
								// console.log(l.current)
							});
						});
					}
				}
			);

			
			
		};

		return {
			restrict : "AE",
			templateUrl: "/views/directives/Light.html",
			scope:{
				roomlights : "="
			},
			controller : control,
			link : linker
		}
	}]
);