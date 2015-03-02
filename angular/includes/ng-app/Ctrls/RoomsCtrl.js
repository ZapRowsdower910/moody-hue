angular.module("Ctrls")
	.factory("roomSocket", ['socketFactory', function(socketFactory){
		var soc = socketFactory();
		
		return soc;
	}])
	.controller("RoomsCtrl", ["$scope","Hue",'socketFactory', function($scope, Hue, socketFactory){
		$scope.rooms = [];
		$scope.app = {
			current : {}
		};

		$scope.activeRoom = undefined;

		var socket = socketFactory();

		Hue.rooms.getAll().then(function(r){
			console.log("all rooms [%o]",r)
			$scope.rooms = r;
			// $scope.activeRoom = r[0];
			$scope.loadRoom(r[0]);
		});

		Hue.app.getPlugins().then(function(r){
			console.log("plugins [%o]",r);
			$scope.app.plugins = r;
		});

		
		$scope.loadRoom = function(room){
			$scope.activeRoom = room;

			Hue.app.getCurrentFx(room.name).then(function(d){
				console.log("current fx", d);
				$scope.app.current.fx = d;
			}, function(e){
				console.error("failed to get current fx", e)
			});

		};

		$scope.fx = {
			turnOn : function(fxName){
				Hue.app.fx.start(fxName, $scope.activeRoom.name);
			},
			turnOff : function(){
				Hue.app.fx.stop($scope.activeRoom.name);
			}
		};

		$scope.app.fx = {
			start : function(f){
				Hue.app.fx.start(f.configs);
			},
			stop : function(f){
				Hue.app.fx.stop(f.configs);
			}
		};


		// socket.on("connect", function(){
		// 	console.log("socket connected");

		// 	socket.emit("get rooms",function(data){
		// 		console.log(data)
		// 	});
		// });

	}]
);