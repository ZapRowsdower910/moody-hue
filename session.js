var _ = require("underscore"),
		hueUtils = require("./utils"),
		log4js = require("log4js"),
		logger = log4js.getLogger("Session"),
		configs;

var utils = {
	lock : {
		byLevel :function(roomName, level){
			var room = utils.findSessionRoom(roomName),
					wasSuccessful = false;

			if(room && level){
				if(!room.fx.locked){
					room.fx.locked = true;
					room.fx.releaseLevel = level;

					logger.info("Room ["+roomName+"] has been successfully locked");
				} else {
					logger.error("Room ["+roomName+"] is already locked");
				}
			}

			return wasSuccessful;
		},
		byId : function(roomName, callerId){
			var room = utils.findSessionRoom(roomName),
					wasLocked = false,
					sessionRoom;

			if(room && callerId){
				room.fx.locked = true;
				room.fx.lockedId = callerId;

				wasLocked = true;
				logger.info("Room ["+roomName+"] has been successfully locked");
			}

			return wasLocked;
		}
	},
	unlock : {
		byLevel : function(roomName, callerId){
			var room = utils.findSessionRoom(roomName),
					wasSuccessful = false;

			if(room && callerId){
				if(room.fx.locked){

					if(room.fx.lockedId == callerId){
						room.fx.locked = false;
						room.fx.lockedId = "";
						room.fx.releaseLevel = 0;

						logger.info("Room ["+roomName+"] has been successfully unlocked");
					} else {
						logger.info("Id ["+callerId+"] is not authorized to unlock this room");
					}

				} else {
					wasSuccessful = true;
				}
				
			}

			return wasSuccessful;
		},
		byId : function(roomName, level){
			var room = utils.findSessionRoom(roomName),
					wasSuccessful = false;

			if(room && level){
				if(room.fx.locked){
					
					if(level >= room.fx.releaseLevel){
						room.fx.locked = false;
						room.fx.lockedId = "";
						room.fx.releaseLevel = 0;

						logger.info("Room ["+roomName+"] has been successfully unlocked");
					} else {
						logger.info("Level ["+level+"] is not authorized to unlock this room. Level ["+room.fx.releaseLevel+"] or higher is required");
					}

				} else {
					wasSuccessful = true;
				}
				
			}

			return wasSuccessful;
		}
	},
	checkRoomByRoom: function(roomName, fx, callerId, level){
		var room = utils.findSessionRoom(roomName);
		return utils.checkRoom(room, fx, callerId, level);
	},
	checkRoom: function(room, fx, callerId, level){
		var canChange = false;
				
		if(room && fx){

			if(!room.fx.locked){
				canChange = true;

			} else if(callerId && room.fx.lockedId == callerId){
				canChange = true;

			} else if(level && room.fx.releaseLevel < level){
				canChange = true;

			} else {
				logger.info("Room is locked, cannot start fx ["+fx+"]");
				canChange = false;
			}
		} else {
			logger.debug("Invaid room [%s] or fx [%s]", JSON.stringify(room), fx);
		}

		return canChange;
	},
	setRoomFx : function(roomName, fx, callerId, level){
		var room = utils.findSessionRoom(roomName),
				wasChanged = false;
				
		canChange = utils.checkRoom(room, fx, callerId, level);

		if(canChange){
			logger.info("Room ["+roomName+"] fx has been changed to ["+fx+"]");
			room.fx.current = fx;
		}

		return canChange;
	},
	findSessionRoom : function(roomName){
		return _.find(app.rooms, function(v,i){
			if(v.name == roomName){
				return v;
			}
		});
	}
};

var app = {
	current : {
		rooms : {},
		mode : "transitions-mid",
		profile : "none",
		rolloverTime : undefined,
		// isSetup : false
	},
	plugins : {
		effects : [],
		services : []
	},
	rooms : []
};

var web = {};

exports.utils = utils;
exports.state = app;
exports.web = web;
exports.init = function(conf){
	configs = conf;
	app.rooms = [];

	_.each(configs.rooms, function(v,i){
		
		var r = {
			id : hueUtils.generateUUID(),
			name : v.name,
			fx : {
				current : "none",
				locked : false,
				lockedId : '',
				releaseLevel : 0
			}
		};

		app.rooms.push(r);
	});

	logger.warn("Setup rooms sessions.");
}