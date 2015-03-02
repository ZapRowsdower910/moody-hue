{
  "server": {
    "port": 8080,
    "ip_addr": "192.168.1.177"
  },
  "general": {
    "apiName": "huey-moods",
    "logging": {
      "level": "DEBUG",
      "fileAppender": {
        "type": "file",
        "filename": "logs/log.file",
        "maxLogSize": 20480,
        "backups": 3
      }
    },
    "latitude": "41.698007",
    "longitude": "-81.395302"
  },
  "configManager": {
    "scheduler":{
      "cycleTime" : 15
    }
  },
  "hue": {
    "portalUrl": "https://www.meethue.com/api/nupnp",
    "baseIp": "192.168.1.183"
  },
  "mongo":{
    "ip":"192.168.1.9",
    "port":27017,
    "dbName":"hue"
  },
  "coment": {
    "defaultRoom": "Living Room",
    "profile": {
      "hue": 65280,
      "sat": 255
    },
    "speed": 3
  },
  "weather": {
    "lights": [
      "2"
    ],
    "cycleTime": 4000,
    "cycleLimit": 10,
    "precipThresholds": [
      {
        "threshold": 0.002,
        "cycleTime": 20000
      },
      {
        "threshold": 0.017,
        "cycleTime": 10000
      },
      {
        "threshold": 0.1,
        "cycleTime": 6000
      },
      {
        "threshold": 0.4,
        "cycleTime": 1000
      }
    ],
    "profiles": [
      {
        "type": "rain",
        "color": {
          "hue": 45000,
          "sat": 250
        }
      },
      {
        "type": "snow",
        "color": {
          "hue": 37000,
          "sat": 200
        }
      },
      {
        "type": "cloudy",
        "color": {
          "hue": 42000,
          "sat": 150,
          "bri": 150
        }
      },
      {
        "type": "wind",
        "color": {
          "hue": 25500,
          "sat": 250
        }
      },
      {
        "type": "clear-day",
        "color": {
          "hue": 18000,
          "sat": 250
        }
      },
      {
        "type": "clear-night",
        "color": {
          "hue": 48000,
          "sat": 250
        }
      },
      {
        "type": "partly-cloudy-day",
        "color": [
          {
            "hue": 42000,
            "sat": 150,
            "bri": 150
          },
          {
            "hue": 18000,
            "sat": 250,
            "bri": 225
          }
        ]
      },
      {
        "type": "partly-cloudy-night",
        "color": [
          {
            "hue": 42000,
            "sat": 150,
            "bri": 150
          },
          {
            "hue": 48000,
            "sat": 250,
            "bri": 225
          }
        ]
      }
    ]
  },
  "accents": {
    "enabled": false,
    "waitForDark": false,
    "timer": 7.369130657357778E+138,
    "transitionTime": 3.684565328678889E+80,
    "profiles": [
      {
        "name": "heavy green",
        "hue": 25500,
        "sat": 255
      },
      {
        "name": "heavy blue",
        "hue": 46920,
        "sat": 255
      }
    ],
    "defaultRoom": "Living Room"
  },
  "bedtime": {
    "bedroom": "Bedroom",
    "end": 10,
    "watcherInterval": 30,
    "wakeup" :{
      "hue":{
        "start":0,
        "end":25000
      },
      "sat":{
        "start":255,
        "end":45
      },
      "bri":150,
      "speed" : 1.5
    }
  },
  "transitions": {
    "transitionTime": 0.1,
    "interval": 0.2,
    "defaultRoom": 0,
    "colorSlide": 7500,
    "brightness": {
      "dim": 150,
      "bright": 250
    },
    "satLevels": {
      "light": [
        50,
        175
      ],
      "mid": [
        100,
        255
      ],
      "heavy": [
        215,
        255
      ]
    }
  },
  "logMeIn": {
    "watcher":{
      "long":80,
      "short":5
    },
    "homeState": {
      "hue": 12000,
      "sat": 50,
      "bri": 230
    },
    "homeRoom": "Living Room",
    "status": {
      "light": 4,
      "colors": {
        "welcome": 25500,
        "pending": 12750,
        "goodbye": 0,
        "unknown": 46920
      }
    }
  },
  "twinkle": {
    "coloredLightCount": 2,
    "cycleTime": 0.5,
    "transitionTime": 0.5,
    "strict": true
  },
  "profiles": [
    {
      "name": "heavy green",
      "hue": 25500,
      "sat": 255
    },
    {
      "name": "heavy blue",
      "hue": 46920,
      "sat": 255
    },
    {
      "name": "heavy yellow",
      "hue": 12750,
      "sat": 255
    },
    {
      "name": "heavy pink",
      "hue": 56100,
      "sat": 255
    }
  ],
  "groups": [
    {
      "name": "accent a",
      "lights": [
        2,
        4
      ]
    },
    {
      "name": "accent b",
      "lights": [
        3,
        4
      ]
    }
  ],
  "rooms": [
    {
      "id":"001",
      "name": "Living Room",
      "lights": [
        {
          "id": 1,
          "x": 754,
          "y": 595
        },
        {
          "id": 2,
          "x": 164,
          "y": 77
        },
        {
          "id": 3,
          "x": 84,
          "y": 141
        },
        {
          "id": 4,
          "x": 587,
          "y": 450
        },
        {
          "id": 5,
          "x": 419,
          "y": 601
        }
      ]
    },
    {
      "id":"002",
      "name": "Bedroom",
      "lights": [
        {
          "id": 6,
          "x": 74,
          "y": 282
        }
      ]
    },
    {
      "id":"003",
      "name": "Kitchen",
      "lights": [
        {
          "id": 7,
          "x": 0,
          "y": 0
        },
        {
          "id": 8,
          "x": 0,
          "y": 0
        }
      ]
    }
  ]
}