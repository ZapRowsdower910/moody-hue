angular.module("Services")
	.factory("Hue", ["$rootScope","$http","$q", 
		function($rootScope, $http, $q){
		var methods = {
			api : {
				get : function(path, d){
					var deferred = $q.defer();

					$http.get(path,{data : d}).then(function(rsp){
						deferred.resolve(rsp.data);
					},function(e){
						deferred.reject(e);
					});

					return deferred.promise;
				},
				put : function(path, data){
					var dfd = $q.defer();
					data = data || {};

					$http.put(path, data).then(function(rsp){
						if(!rsp.data.error){
							dfd.resolve(rsp.data);
						} else {
							dfd.reject(rsp.data);	
						}
						
					}, function(e){
						// TODO: Some kind of site wide common connection error
						// maybe modal or bootstrap alert box?
						console.log("api request exploded", e);
						dfd.reject(e);
					});

					return dfd.promise;
				}
			},
			app : {
				getCurrentFx : function(room){
					return methods.api.get("/fx/current/" + room);
				},
				getPlugins : function(){
					return methods.api.get("/session/app/plugins");
				},
				fx : {
					start : function(fxName, room){
						return methods.api.put("/" + fxName.toLowerCase() + "/start", {"room": room});
					},
					stop : function(room){
						return methods.api.put("/fx/clear/" +  room);
					}
				}
			},
			rooms : {
				getAll : function(){
					
					return methods.api.get("/rooms/all")
					// .then(function(d){
						
					// })
				}
			},
			lights : {
				getState : function(id){
					return methods.api.get("/lights/state/" + id);
				},
				turnOff : function(id){
					return methods.api.put("/turnOff/" + id);
				},
				turnOn : function(id){
					return methods.api.put("/turnOn/" + id);
				}
			}


		};

		return methods;
	}]
);
