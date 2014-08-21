{
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
    }
  },
  "server": {
    "port": 8080,
    "ip_addr": "192.168.1.7"
  },
  "hue": {
    "portalUrl": "https://www.meethue.com/api/nupnp",
    "baseIp": "192.168.1.6"
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
    "timer": 5.6860576059859396E+119,
    "transitionTime": 2.8430288029929705E+69,
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
    "end": 10,
    "watcherInterval": 30
  },
  "transitions": {
    "transitionTime": 1,
    "interval": 5,
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
  "roomsConfigs": {
    "homeState": {
      "hue": 12000,
      "sat": 50,
      "bri": 230
    },
    "homeLights": [
      1,
      2,
      3,
      4,
      5
    ],
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
      "name": "Living Room",
      "lights": [
        {
          "id": 1,
          "x": 782,
          "y": 444
        },
        {
          "id": 2,
          "x": 82,
          "y": 42
        },
        {
          "id": 3,
          "x": 35,
          "y": 73
        },
        {
          "id": 4,
          "x": 637,
          "y": 347
        },
        {
          "id": 5,
          "x": 485,
          "y": 436
        }
      ]
    },
    {
      "name": "Bedroom",
      "lights": [
        {
          "id": 6,
          "x": 74,
          "y": 282
        }
      ]
    }
  ]
}