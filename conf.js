{
	"general" : {
		"longitude" : -81.3977210,
		"latitude" : 41.6986320,
		"mode":"accent"
	},
	"accents" : {
		"enabled" : true,
		"timer" : 1800000 ,
		"transitionTime":300000,
		"bri": 200,
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
				"group":"accent c"
			},
			{	
				"name" : "heavy pink",
				"hue" : 56100,
				"sat" : 255,
				"group":"accent d"
			}
		]
	},
	"groups" : [
		{
			"name" : "accent a",
			"lights" : [
				2,
				4,
				5
			]
		},
		{
			"name" : "accent b",
			"lights" : [
				3,
				4
			]
		},
		{
			"name" : "accent c",
			"lights" : [
				2,
				3,
				4
			]
		},
		{
			"name" : "accent d",
			"lights" : [
				2,
				3,
				5
			]
		},
		{
			"name" : "theather",
			"lights" : [
				2,
				4
			]
		},
		{
			"name" : "full",
			"lights" : [
				1,
				2,
				3,
				4
			]
		},
		{
			"name" :"bedtime",
			"lights" : [
				6
			]
		},
		{
			"name" : "home",
			"lights" : [
				1,
				3
			]
		}
	]
}