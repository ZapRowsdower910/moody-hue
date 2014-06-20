moody-hue
=========

A rest service to control Philips hue light bulbs written for Node. 

Adding plugins: Just drop the new plugin into the plugins folder. The service will bootstrap any .js file in that folder. It will then attempt to run {plugin-file}.actions.init()

Current plugins:
- Transitions - Cycles a rooms lights through the color spectrum randomly.
- Bedtim - Turn off all lights but your bedroom, put server in a state to prevent automated functions.
- Rooms - Categories lights into rooms. Helps ease apply effects to whole rooms. Enables logging into / out of the house.             Loggin into the house during the day will schedule a configured rooms lights to turn on when sunset starts.
          Loggin out of the house will turn off all the lights and put the service into a sleep mode until login.
- Weather - Use a light to give a visual forcast.
