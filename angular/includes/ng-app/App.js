angular.module("MoodyHues", 
  ['ui.router', 'ui.bootstrap', 'btford.socket-io', "Ctrls", "Services", "Directives"])
.run(
  [          '$rootScope', '$state', '$stateParams',
    function ($rootScope,   $state,   $stateParams) {

    // It's very handy to add references to $state and $stateParams to the $rootScope
    // so that you can access them from any scope within your applications.For example,
    // <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
    // to active whenever 'contacts.list' or one of its decendents is active.
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    }
  ]
)
.config(["$stateProvider", "$urlRouterProvider", 
	function($stateProvider, $urlRouterProvider){

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state("Rooms", {
				url : "/",
				templateUrl: "views/Rooms.html",
				controller: "RoomsCtrl"
			})

    // socket.prefix('');
	}]
);