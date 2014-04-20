{
	"general" : {
		"longitude" : -81.3977210,
		"latitude" : 41.6986320
	},
	"accents" : {
		"enabled" : true,
		"timer" : 300000,
		"profiles" : [
			{	
				"name" : "heavy green",
				"hue" : 25500,
				"sat" : 255,
				"group":"accent a"
			},
			{	
				"name" : "heavy blue",
				"hue" : 46920,
				"sat" : 255,
				"group":"accent b"
			},
			{	
				"name" : "heavy yellow",
				"hue" : 12750,
				"sat" : 255,
				"group":"group 1"
			}
		]
	},
	"groups" : [
		{
			"name" : "accent a",
			"lights" : [
				"2",
				"4"
			]
		},
		{
			"name" : "accent b",
			"lights" : [
				"3",
				"4"
			]
		},
		{
			"name" : "theather",
			"lights" : [
				"2",
				"4"
			]
		},
		{
			"name" : "full",
			"lights" : [
				"1",
				"2",
				"3",
				"4"
			]
		}
	]
}