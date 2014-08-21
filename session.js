var app = {
	current : {
		mode : "transitions-mid",
		profile : "none",
		rolloverTime : undefined,
		// isSetup : false
	},
	plugins : {
		effects : []
	}
};

var web = {
	// rooms : [
	// 	{
	// 		"name" : "Living Room",
	// 		"lights" : [
	// 			{"id" : 1},
	// 			{"id" : 2},
	// 			{"id" : 3},
	// 			{"id" : 4},
	// 			{"id" : 5}
	// 		]
	// 	},
	// 	{
	// 		"name" : "Bedroom",
	// 		"lights" : [
	// 			{
	// 				"id" : 6,
	// 				"x" : 50,
	// 				"y" : 50
	// 			}
	// 		]
	// 	}
	// ]
};

exports.state = app;
exports.web = web;