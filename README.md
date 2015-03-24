moody-hue
=========

A rest service to control Philips hue light bulbs written for Node. 

Adding plugins: Just drop the new plugin into the plugins folder. The service will bootstrap any .js file in that folder. It will then attempt to run {plugin-file}.actions.init()

Current plugins:
- Twinkle - Picks a set random number of lights in a given room and slightly saturates their colors, while keeping unselected lights a normal light bulb coloring. The effect is set to fire every few minutes giving the room a slight shifting color. Works well for accenting room while in it.
- Transitions - Cycles a rooms lights through the color spectrum. Each light will slide up the color field by a set value, giving the room a color theme but with a variety of shades. Transisitions has 3 modes, light, mid and heavy. The heavier the mode the more saturation the lights will have. Color changes occur in a longer time frame - 45mins or longer. Transitions are very gradual. Better for ambient light in unoccupied rooms.
- Bedtime - Turn off all lights but your bedroom, put server in a state to prevent automated events like Twinkle or Transitions. Also includes a wakeup effect for the bedroom where it attempts to simulate a sunrise. Best paired w/ a alarm app that can send api requests.
- LogMeIn - A auto sign app for hue. When setup with tasker your phone becomes your light switch simply by entering your Wifi network. LogMeIn can queue up lights turning on if the login event occurred before night time. You can also log out of your house which will turn off all lights in your house.
- Weather - Old - may be broken currently. Use a light to give a visual forcast.


To install application clone git repository or use 'sudo npm install moody-hues'. Modify the config.js file with the IP address where the rest end point should live. 

For use with LogMeIn plugin it is recommended to also configure the correct latidute and longitude. Lat and Long is used to calculate daily sun events like sunrise and sunset. Default Lat and Long is for the Cleveland, Oh area.

Web UI: http://[your-server-ip]:8080
for example if you setup your moody-hues server to be '192.168.1.117' -- http://192.168.1.117:8080

To start the application: node hue.js
