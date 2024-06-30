const publicIp = require("public-ip");
var mongodb = require("mongodb");

var database = null;
var roommanager = require("../room_manager/roommanager");
const { config, emit } = require("process");
const { Double } = require("bson");
const tablemanager = require("../game_manager/tablemanager");
var gamelog = require('../game_manager/gamelog');
const utils = require('../utils/utils')
var serverip = "34.236.143.255";
var io;
var port = "10015";

exports.initdatabase = function (db) {
	database = db;
	(async () => {
		// gamelog.showlog(await publicIp.v4());
		// serverip = await publicIp.v4();
		//gamelog.showlog("serverip: ", serverip);
		// console.log(serverip);
		//=> '46.5.41.123'
		//gamelog.showlog(await publicIp.v6());
		//=> 'fe80::200:f8ff:fe21:67cf'
	})();
	var collection = database.collection("User_Data");
};

exports.setsocketio = function (socketio) {
	io = socketio;
};
exports.CheckVersionCode = function (socket) {
	let emitdata = { result: "8.8" };
	// console.log(utils.toBinary(emitdata))
	socket.emit("CHECK_VERSION_CODE_RESULT", emitdata);
};
exports.LogIn = function (socket, userInfo) {
	 console.log(userInfo.version);
	if (userInfo.version == null || userInfo.version != "8.8") {
		let emitdata = { result: "failed" };
		socket.emit("GET_LOGIN_RESULT", emitdata);
	} else {
		let collection = database.collection("User_Data");
		let query = {
			facebook_id: userInfo.facebook_id,
		};
		if (userInfo.facebook_id == "" || userInfo.facebook_id == undefined || userInfo.facebook_id == null) {
			query = {
				username: userInfo.username
			}
		}
		collection.findOne(query, function (err, result) {
			if (err){} //  gamelog.showlog("error13", err);
			else {
				if (result == null) {
					let emitdata = { result: "failed" };
					socket.emit("GET_LOGIN_RESULT", emitdata);
				} else {
					if (result.username != userInfo.username) {
						result.username = userInfo.username;
						collection.updateOne(query, { $set: { username: userInfo.username } }, function (err, result) {
						});
					}
					if (result.connect != "") {
						let clients = io.sockets.clients();
						for (let key in clients.sockets) {
							if (result.connect == key) {
								let emitdata = { result: "failed" };
								socket.emit("GET_LOGIN_RESULT", emitdata);
								return;
							}
							if (clients.sockets[key].id == socket.id && (clients.sockets[key].username == undefined || clients.sockets[key].username == null)) {
								socket.username = result.userid;
								socket.emit("GET_LOGIN_RESULT", {
									result: "success",
									data: result,
								});
								break;
							}
						}
						socket.username = result.userid;
						socket.emit("GET_LOGIN_RESULT", {
							result: "success",
							data: result,
						});
						collection.updateOne(
							query,
							{ $set: { connect: socket.id } },
							function (err) {
								if (err) throw err;
							}
						);
					} else if (result.status == 1) {
						let emitdata = { result: "failed" };
						socket.emit("GET_LOGIN_RESULT", emitdata);
					} else {
						collection.updateOne(
							query,
							{ $set: { connect: socket.id } },
							function (err) {
								if (err) throw err;
							}
						);
						gamelog.showlog("- User: ", result.username, " has logged in");
						socket.username = result.userid;
						socket.emit("GET_LOGIN_RESULT", {
							result: "success",
							data: result,
						});

						setTimeout(() => {
							let collection = database.collection("User_Data");
							collection.find().toArray(function (err, docs) {
								if (!err) {
									if (docs.length > 0) {
										let count = 0;
										for (let i = 0; i < docs.length; i++) {
											const element = docs[i];
											if (element.connect != "") count++;
										}
										//gamelog.showlog("--------------- online_users : ", count);
										io.sockets.emit("ONLINE_USERS", { count: count });
									}
								}
							});
						}, 1000);
					}
				}
			}
		});
	}
};
function makeRandom(min, max) {
	var RandVal = Math.floor(Math.random() * (max - min + 1)) + min;
	return RandVal;
}
exports.SignUp = function (socket, data) {
	let lManager = this;
	// console.log(data.version);
	if (data.version == null || data.version != "8.8") {
		socket.emit("GET_REGISTER_RESULT", { result: "failed" });
	} else {
		let collection = database.collection("User_Data");
		collection.findOne({ facebook_id: data.facebook_id }, function (err, result) {
			if (err || result == null || data.signtype == 'guest') {
				collection.find().toArray(function (err, docs) {
					if (err) {
						throw err;
					} else {
						let randomnum1 = "" + Math.floor(100000 + Math.random() * 900000);
						let randomnum2 = "" + Math.floor(100000 + Math.random() * 900000);
						let randomnum = randomnum1 + randomnum2;
						while (
							docs.filter(
								(doc) =>
									doc.userid == randomnum && doc.username.includes(randomnum2)
							).length > 0
						) {
							randomnum2 -= 1;
							randomnum = randomnum1 + randomnum2;
						}
						let name = "Guest" + randomnum2;
						var referralCode = "" + Math.floor(100000 + Math.random() * 900000);
						if (data.signtype == "facebook") {
							name = data.username;
						}

						let best_winning_hand = { cards: [], hand: "", handval: 0.0 };

						let user_data = {
							username: name,
							userid: randomnum,
							password: "",
							photo: "",
							photo_index: makeRandom(1, 25),
							photo_type: 0, // normal photo (1: facebook photo),
							facebook_id: data.facebook_id,
							points: 2000000000,
							level: 1,
							archivement: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							hands_played: 0,
							hands_won: 0,
							biggest_pot_won: 0,
							best_winning_hand: best_winning_hand,
							win_percent_holdem: 0,
							win_percent_spin: 0,
							tour_won: 0,
							likes: 0,
							buddies: 0,
							friends: [],
							recents: [],
							referral_code: referralCode,
							referral_count: 0,
							referral_users: [],
							created_date: new Date(),
							mail_date: new Date(),
							spin_date: new Date(),
							dailyReward_date: new Date(),
							messages: [],
							status: 0,
							connected_room: -1,
							connect: socket.id,
						};

						collection.insertOne(user_data);
						//gamelog.showlog("- New user: " + name + " has Registered.");
						socket.username = randomnum;
						socket.emit("GET_REGISTER_RESULT", {
							result: "success",
							data: user_data,
						});
						setTimeout(() => {
							let collection = database.collection("User_Data");
							collection.find().toArray(function (err, docs) {
								if (!err) {
									if (docs.length > 0) {
										let count = 0;
										for (let i = 0; i < docs.length; i++) {
											const element = docs[i];
											if (element.connect != "") count++;
										}
										//gamelog.showlog("--------------- online_users : ", count);
										io.sockets.emit("ONLINE_USERS", { count: count });
									}
								}
							});
						}, 1000);
					}
				});
			} else {
				// socket.emit("GET_REGISTER_RESULT", { result: "failed" });
				lManager.LogIn(socket, data);
			}
		});

	}
};
exports.Valid_Name = function (socket, data) {
	var collection = database.collection("User_Data");
	collection
		.find({ username: data.name, facebook_id: data.facebook_id })
		.toArray(function (err, docs) {
			if (err) {
				throw err;
			} else {
				if (docs.length > 0) {
					var mydata = "{" + '"result" : "failed"' + "}";
					socket.emit("REQ_VALID_NAME_RESULT", JSON.parse(mydata));
				} else {
					var mydata = "{" + '"result" : "success"' + "}";
					socket.emit("REQ_VALID_NAME_RESULT", JSON.parse(mydata));
				}
			}
		});
};
exports.INIT_CONNECT = function (socket, data) {
	var collection = database.collection("User_Data");
	var query = { userid: data.userid };
	collection.findOne(query, function (err, result) {
		if (err){} //  gamelog.showlog("error14", err);
		else {
			if (result != null) {
				collection.updateOne(query, { $set: { connect: "" } }, function (err) {
					if (err) throw err;
				});
			}
		}
	});
};
exports.GetUserInfo = function (socket, userInfo) {
	//gamelog.showlog("Get User Info ", userInfo);
	var collection = database.collection("User_Data");
	let query = { userid: userInfo.userid };
	collection.findOne(query, function (err, result) {
		if (err) {
			//gamelog.showlog("error15", err);
		} else {
			var mydata;
			if (result == null) {
				mydata = {
					result: "failed",
				};
			} else {
				mydata = {
					result: "success",
					info: result,
				};
			}
			//gamelog.showlog(mydata);
			socket.emit("GET_USERINFO_RESULT", mydata);
		}
	});
};
exports.UpdateUserSlotValue = function (socket, userInfo) {
	const collection = database.collection("Slot_Data");
	const query = { userid: userInfo.userid };
	collection.findOne(query, function (err, result) {
		if (err){} //  gamelog.showlog("error17", err);
		else {
			if (result == null) {
				const slotData = {
					id: userInfo.userid,
					saveCoins: userInfo.saveCoins,
					saveFbCoins: userInfo.saveFbCoins,
					saveLevel: userInfo.saveLevel,
					saveLevelProgress: userInfo.saveLevelProgress,
				};
				collection.insertOne(slotData);
			} else {
				collection.updateOne(
					query,
					{
						$set: {
							saveCoins: userInfo.saveCoins,
							saveFbCoins: userInfo.saveFbCoins,
							saveLevel: userInfo.saveLevel,
							saveLevelProgress: userInfo.saveLevelProgress,
						},
					},
					function (err) {
						if (err){} //  gamelog.showlog("error18", err);
					}
				);
			}
		}
	});
};
exports.UpdateUserInfo_Balance = function (socket, userInfo) {
	//gamelog.showlog("chipupdate");
	//gamelog.showlog(userInfo);
	var collection = database.collection("User_Data");
	var query = { userid: userInfo.userid };
	if (userInfo.type == "1") {
		// slot
		let bets = fixNumber(userInfo.points1);
		let gets = fixNumber(userInfo.points2);
		let isSafe = false;
		// if (gets < 0)
		//     isSafe = true;
		// else if (bets * 10 < gets)
		//     isSafe = false;
		//if (bets > 2000000000000) isSafe = false;
		if (isSafe) {
			collection.findOne(query, function (err, result) {
				if (err){} //  gamelog.showlog("error16", err);
				else {
					let points = fixNumber(result.points) + fixNumber(gets);
					collection.updateOne(
						query,
						{ $set: { points: points } },
						function (err) {
							if (err) throw err;
							else
								socket.emit("REQ_UPDATE_USERINFO_BALANCE_RESULT", {
									result: points,
								});
						}
					);
				}
			});
		}
	} else if (userInfo.type == "2") {
		collection.findOne(query, function (err, result) {
			if (err){} //  gamelog.showlog("error17", err);
			else {
				let buyData = {
					id: userInfo.userid,
					money: userInfo.points,
					addOn: userInfo.points - result.points,
					time: new Date(),
					type: userInfo.type,
				};
				database.collection("Buy_Data").insertOne(buyData);
				gamelog.showlog("buyChips");
				gamelog.showlog(buyData);

				let points = fixNumber(userInfo.points);
				collection.updateOne(
					query,
					{ $set: { points: points } },
					function (err) {
						if (err) throw err;
						// else
						//     socket.emit('REQ_UPDATE_USERINFO_BALANCE_RESULT', { result: points });
					}
				);
			}
		});
	} else if (userInfo.type == "3") {
		collection.findOne(query, function (err, result) {
			if (err){} //  gamelog.showlog("error19", err);
			else {
				let points = result.points;
				socket.emit("REQ_UPDATE_USERINFO_BALANCE_RESULT", { result: points });
			}
		});
	} else if (userInfo.type == "4") {
		let userid = userInfo.userid;
		let points = userInfo.points;
		let tableId = userInfo.tableId;
		roommanager.addChipsTouserInTable(tableId, userid, points);
	} else if (userInfo.type == "5") {
		let userid = userInfo.userid;
		let points = userInfo.points;
		let tableId = userInfo.tableId;
		roommanager.minusChipsTouserInTable(tableId, userid, points);
	} else if (userInfo.type == "6") {
		collection.findOne(query, function (err, result) {
			if (err){} //  gamelog.showlog("error17", err);
			else {
				let buyData = {
					id: userInfo.userid,
					money: userInfo.points,
					addOn: userInfo.points - result.points,
					time: new Date(),
					type: userInfo.type,
				};
				database.collection("Slot_Data").insertOne(buyData);
				//gamelog.showlog("slot");
				//gamelog.showlog(buyData);

				let points = fixNumber(userInfo.points);
				collection.updateOne(
					query,
					{ $set: { points: points } },
					function (err) {
						if (err) throw err;
						// else
						//     socket.emit('REQ_UPDATE_USERINFO_BALANCE_RESULT', { result: points });
					}
				);
			}
		});
	}
};
exports.Get_User_Photo = function (info, socket) {
	var collection = database.collection("User_Data");
	let url =
		"https://graph.facebook.com/" +
		info.fb_id +
		"/picture?type=square&height=300&width=300";
	collection.updateOne(
		{ userid: info.userid },
		{ $set: { photo: url } },
		function (err) {
			if (err) throw err;
			else {
				let emitdata = {
					photo: url,
				};
				socket.emit("UPLOAD_USER_PHOTO_RESULT", emitdata);
			}
		}
	);
};
exports.Update_Photo_Index = function (info) {
	var collection = database.collection("User_Data");
	collection.updateOne(
		{ userid: info.userid },
		{ $set: { photo_index: parseInt(info.photo_index) } },
		function (err) {
			if (err) throw err;
		}
	);
};
exports.Update_Photo_Type = function (info) {
	var collection = database.collection("User_Data");
	collection.updateOne(
		{ userid: info.userid },
		{ $set: { photo_type: parseInt(info.photo_type) } },
		function (err) {
			if (err) throw err;
		}
	);
};
exports.Rankinginfo = function (data, socket) {
	var userInfo = "";
	var collection = database.collection("User_Data");
	collection
		.find()
		.sort({ points: -1 })
		.toArray(function (err, docs) {
			if (err) {
				//gamelog.showlog("error18", err);
				throw err;
			} else {
				//gamelog.showlog(docs);
				for (var i = 0; i < docs.length; i++) {
					let tPoints = docs[i].points;
					if (tPoints.toString().length > 19) {
						tPoints = 9000000000000000000;
						collection.updateOne({ userid: docs[i].userid }, { $set: { points: tPoints }, }, function (err) {
							if (err){} //  gamelog.showlog(err);
						})
					}
					userInfo =
						userInfo +
						"{" +
						'"id":"' +
						docs[i].userid +
						'",' +
						'"connect":"' +
						docs[i].connect +
						'",' +
						'"status":"' +
						docs[i].status +
						'",' +
						'"username":"' +
						docs[i].username +
						'",' +
						'"photo":"' +
						docs[i].photo +
						'",' +
						'"photo_index":"' +
						docs[i].photo_index +
						'",' +
						'"photo_type":"' +
						docs[i].photo_type +
						'",' +
						'"level":"' +
						docs[i].level +
						'",' +
						'"points":"' +
						tPoints +
						'"},';
				}
				userInfo = userInfo.substring(0, userInfo.length - 1);
				userInfo = "{" + '"users"  : [' + userInfo;
				userInfo = userInfo + "]}";
				// gamelog.showlog(JSON.parse(userInfo));
				socket.emit(
					"REQUEST_ALL_PLAYER_RANKINGINFO_RESULT",
					JSON.parse(userInfo)
				);
			}
		});
};
exports.updateProfile = function (socket, userInfo) {
	var collection = database.collection("User_Data");
	var query = {
		username: userInfo.username,
	};

	collection.findOne(query, function (err, result) {
		if (err) {
			//gamelog.showlog("error20", err);
		} else {
			collection.updateOne(
				query,
				{
					$set: {
						points: fixNumber(userInfo.balance),
					},
				},
				function (err) {
					if (err) throw err;
					else {
						roommanager.GetUserList();
					}
				}
			);
		}
	});
};

exports.updateProfile = function (socket, userInfo) {
	let collection = database.collection("User_Data");
	let query = {
		userid: userInfo.userid,
	};

	collection.findOne(query, function (err, result) {
		if (err) {
			//gamelog.showlog("error20", err);
		} else {
			collection.updateOne(
				query,
				{
					$set: {
						points: fixNumber(userInfo.balance),
					},
				},
				function (err) {
					if (err) throw err;
					else {
						roommanager.GetUserList();
					}
				}
			);
		}
	});
};
exports.Report_Message = function (socket, data) {
	let collection = database.collection("Report_Data");
	respondent_name = "";
	if (data.respondent != undefined || data.respondent != null)
		respondent_name = data.respondent;
	respondent_id = "";
	if (data.respondent_id != undefined || data.respondent_id != null)
		respondent_id = data.respondent_id;
	let insertData = {
		username: data.username,
		userid: data.userid,
		message: data.message,
		respondent: respondent_name,
		respondent_id: respondent_id,
		date: new Date(),
	};

	collection.insertOne(insertData);
};
exports.panel_login = function (socket, data) {
	let collection = database.collection("User_Data");
	let totalUsers = 0;
	let onlineUsers = 0;
	collection.find().toArray(function (err, docs) {
		if (!err) {
			totalUsers = docs.length;
			if (docs.length > 0) {
				let count = 0;
				for (let i = 0; i < docs.length; i++) {
					const element = docs[i];
					if (element.connect != "") count++;
				}
				onlineUsers = count;
			}
		}
	});
	if (data.type == "login") {
		let query = { userid: data.id, password: data.password };
		collection.findOne(query, function (err, result) {
			if (err) throw err;
			else {
				if (result == null) {
					let emitdata = { result: "Login failed" };
					socket.emit("PANEL_LOGIN_RESULT", emitdata);
				} else {
					if (result.status == 1) {
						let emitdata = { result: "You has blocked" };
						socket.emit("PANEL_LOGIN_RESULT", emitdata);
					} else {
						setTimeout(() => {
							let emitdata = {
								result: "Login Success",
								userid: data.id,
								password: data.password,
								username: result.username,
								total_users: totalUsers,
								online_users: onlineUsers,
							};
							socket.emit("PANEL_LOGIN_RESULT", emitdata);
							exports.GetUserInfo(socket, { userid: result.userid });
						}, 200);
					}
				}
			}
		});
	} else if (data.type == "register") {
		let query = { userid: data.id };
		collection.findOne(query, function (err, result) {
			if (err) throw err;
			else {
				if (result == null) {
					let emitdata = { result: "Register failed" };
					socket.emit("PANEL_LOGIN_RESULT", emitdata);
				} else {
					collection.updateOne(
						query,
						{
							$set: {
								password: data.password,
							},
						},
						function (err) {
							if (err) throw err;
							else {
								setTimeout(() => {
									let emitdata = {
										result: "Register Success",
										userid: data.id,
										password: data.password,
										username: result.username,
										total_users: totalUsers,
										online_users: onlineUsers,
									};
									socket.emit("PANEL_LOGIN_RESULT", emitdata);
									exports.GetUserInfo(socket, { userid: result.userid });
								}, 200);
							}
						}
					);
				}
			}
		});
	}
};
exports.admin_remove_chat = function (socket, data) {
	let collection = database.collection("Public_Chat_Data");
	let query = {
		_id: new mongodb.ObjectId(data.id),
	};
	collection.deleteOne(query, function (err, removed) {
		if (err) {
			//gamelog.showlog("removeerr", err);
		} else {
			let chats = [];
			collection.find().toArray(function (err, docs) {
				if (!err) {
					if (docs.length > 0) {
						let counter = 0;
						for (let i = docs.length - 1; i >= 0; i--) {
							counter++;
							const element = docs[i];
							chats.push(element);
							if (counter == 100) break;
						}
					}
				}
			});
			setTimeout(() => {
				let emitdata = {
					result: "success",
					chat_data: chats,
				};
				socket.emit("RES_PUBLIC_CHAT_RESULT", emitdata);
			}, 100);
		}
	});
};
exports.admin_remove_all_chat = function (socket, data) {
	let collection = database.collection("Public_Chat_Data");
	let query = {
		_id: data.id,
	};
	collection.deleteMany(function (err, removed) {
		if (err) {
			//gamelog.showlog("removeallerr", err);
		} else {
			let chats = [];
			collection.find().toArray(function (err, docs) {
				if (!err) {
					if (docs.length > 0) {
						let counter = 0;
						for (let i = docs.length - 1; i >= 0; i--) {
							counter++;
							const element = docs[i];
							chats.push(element);
							if (counter == 100) break;
						}
					}
				}
			});
			setTimeout(() => {
				let emitdata = {
					result: "success",
					chat_data: chats,
				};
				socket.emit("RES_PUBLIC_CHAT_RESULT", emitdata);
			}, 100);
		}
	});
};
exports.admin_panel_login = function (socket, data) {
	let collection = database.collection("User_Data");
	let totalUsers = 0;
	let onlineUsers = 0;
	let clients = io.sockets.clients();

	let collection1 = database.collection("Admin_Data");
	let query = { id: data.id, password: data.password };
	collection1.findOne(query, function (err, result) {
		if (err) throw err;
		else {
			if (result != null) {
				collection.countDocuments({}, function (err, result) {
					if (result) {
						let emitdata = {
							result: "success",
							id: data.id,
							password: data.password,
							total_users: result,
							online_users: Object.keys(io.sockets.sockets).length,
						};
						socket.emit("ADMIN_LOGIN_RESULT", emitdata);
					}
				});
			} else {
				let emitdata = { result: "failed" };
				socket.emit("ADMIN_LOGIN_RESULT", emitdata);
			}
		}
	});
};
exports.send_chips = function (socket, data) {
	out_points(socket, data.sender_id, data.chips);
	in_points(data.receiver_id, data.chips);
	Insert_Trans_History(data.sender_id, data.receiver_id, data.chips);
};
exports.admin_send_chips = function (socket, data) {
	in_points(data.receiver_id, data.chips);
	let collection = database.collection("Trans_History");
	let insertData = {
		sender: data.sender,
		sender_id: data.sender_id,
		receiver: data.receiver,
		receiver_id: data.receiver_id,
		chips: fixNumber(data.chips),
		type: "sent",
		date: new Date(),
	};

	collection.insertOne(insertData);
};
exports.admin_remove_chips = function (socket, data) {
	out_points(socket, data.receiver_id, data.chips);
	let collection = database.collection("Trans_History");
	let insertData = {
		sender: data.sender,
		sender_id: data.sender_id,
		receiver: data.receiver,
		receiver_id: data.receiver_id,
		chips: fixNumber(data.chips),
		type: "removed",
		date: new Date(),
	};

	collection.insertOne(insertData);
};
exports.trans_history = function (socket, data) {
	let collection = database.collection("Trans_History");
	let username = data.username;

	let hiss = [];
	collection.find().toArray(function (err, docs) {
		if (!err) {
			if (docs.length > 0) {
				hiss = docs.filter(function (object) {
					return object.sender == username || object.receiver == username;
				});
			}
		}
	});
	let Interval = setInterval(() => {
		if (hiss != null) {
			let emitdata = {
				his_data: hiss,
			};
			socket.emit("TRANS_HISTORY_RESULT", emitdata);
			clearInterval(Interval);
		}
	}, 200);
};
exports.set_block = function (socket, data) {
	let collection = database.collection("User_Data");

	let query = { userid: data.userid };
	collection.updateOne(
		query,
		{ $set: { status: parseInt(data.status) } },
		function (err) {
			if (err) {
				//gamelog.showlog("abcd");
			} else {
				socket.emit("SET_BLOCK_RESULT", {
					userid: data.userid,
					status: parseInt(data.status),
				});
			}
		}
	);
};
exports.getRports = function (socket) {
	let collection = database.collection("Report_Data");
	collection.find().toArray(function (err, docs) {
		if (!err) {
			socket.emit("GET_REPORTS_RESULT", { result: docs });
		}
	});
};
exports.send_Notice = function (socket, data) {
	// console.log(data);
	io.sockets.emit("SEND_NOTICE_RESULT", data);
};
exports.send_Mail = function (socket, data) {
	if (data.userid == "") {
		var collection = database.collection("User_Data");
		collection.find().toArray(function (err, result) {
			if (err){} //  gamelog.showlog(err);
			else {
				for (let i = 0; i < result.length; i++) {
					let insertData = {
						userid: result[i].userid,
						mail: data.mail,
						created_date: new Date(),
					};
					var collection1 = database.collection("Mail_Data");
					collection1.insertOne(insertData, function (err) {
						if (err){} //  gamelog.showlog(err);
					});
				}
			}
		});
	} else {
		let insertData = {
			userid: data.userid,
			mail: data.mail,
			created_date: new Date(),
		};
		var collection1 = database.collection("Mail_Data");
		collection1.insertOne(insertData, function (err) {
			if (err){} //  gamelog.showlog(err);
		});
	}
};
exports.update_MailDate = function (socket, data) {
	var collection = database.collection("User_Data");
	let query = {
		userid: data.userid,
	};
	collection.updateOne(
		query,
		{ $set: { mail_date: new Date() } },
		function (err) {
			if (err){} //  gamelog.showlog(err);
		}
	);
};
exports.remove_AllMail = function (socket, data) {
	var collection = database.collection("Mail_Data");
	let query = {
		userid: data.userid,
	};
	collection.deleteMany(query, function (err) {
		if (err){} //  gamelog.showlog(err);
	});
};
exports.remove_Mail = function (socket, data) {
	var collection = database.collection("Mail_Data");
	let query = {
		userid: data.userid,
		_id: new mongodb.ObjectId(data.id),
	};
	collection.deleteOne(query, function (err) {
		if (err){} //  gamelog.showlog(err);
	});
};
exports.req_Mail = function (socket, data) {
	var collection = database.collection("Mail_Data");
	var user_collection = database.collection("User_Data");
	let query = {
		userid: data.userid,
	};
	collection.find(query).toArray(function (err, result) {
		if (err){} //  gamelog.showlog(err);
		else {
			let count = 0;
			user_collection.findOne(query, function (err, result1) {
				if (err){} //  gamelog.showlog(err);
				else if (result1) {
					if (!result1.mail_date) {
						count = result.length;
					} else {
						let mail_date = new Date(result1.mail_date);
						for (let i = 0; i < result.length; i++) {
							let created_date = new Date(result[i].created_date);
							if (mail_date < created_date) {
								count++;
							}
						}
					}
					socket.emit("RES_MAIL", { data: result, count: count });
				}
			});
		}
	});
};
function in_points(userid, in_points) {
	var collection = database.collection("User_Data");
	var query = { userid: userid };
	collection.findOne(query, function (err, result) {
		if (err) throw ("in_points:", err);
		else if (result) {
			let mypoints = fixNumber(result.points);
			in_points = fixNumber(in_points);
			mypoints = mypoints + in_points;
			collection.updateOne(
				query,
				{ $set: { points: mypoints } },
				function (err) {
					if (err) throw err;
					else {
						io.sockets.emit("UPDATE_USERINFO_BALANCE_RESULT", {
							userid: userid,
							points: mypoints,
						});
					}
				}
			);
		}
	});
}
function out_points(socket, userid, out_points) {
	var collection = database.collection("User_Data");
	var query = { userid: userid };
	collection.findOne(query, function (err, result) {
		if (err) throw ("out_points:", err);
		else if (result) {
			let mypoints = fixNumber(result.points);
			out_points = fixNumber(out_points);
			mypoints = mypoints - out_points;
			if (mypoints < 0) mypoints = 0;
			collection.updateOne(
				query,
				{ $set: { points: mypoints } },
				function (err) {
					if (err) throw err;
					else {
						socket.emit("UPDATE_USERINFO_BALANCE_RESULT", {
							userid: userid,
							points: mypoints,
						});
					}
				}
			);
		}
	});
}
function Insert_Trans_History(sender, receiver, chips) {
	var collection = database.collection("Trans_History");
	let insertData = {
		sender: sender,
		receiver: receiver,
		chips: fixNumber(chips),
		date: new Date(),
	};

	collection.insertOne(insertData);
}

function fixNumber(str) {
	let newStr = str.toString().replace(/\,/g, "");
	let _fixnumber = Number(newStr);
	return _fixnumber;
}

exports.MutePlayer = function (socket, data) {
	var collection = database.collection("Mute_History");
	let insertData = {
		UserID: data.UserID,
		OtherID: data.OtherID,
	};
	collection.insertOne(insertData);
};

exports.UnMutePlayer = function (socket, data) {
	var collection = database.collection("Mute_History");
	collection.deleteOne({ UserID: data.UserID, OtherID: data.OtherID });
};

exports.MuteList = function (socket, data) {
	var collection = database.collection("Mute_History");
	collection
		.find({ $or: [{ UserID: data.UserID }, { OtherID: data.UserID }] })
		.toArray(function (err, result) {
			if (result.length != 0) {
				socket.emit("PLAYER_MUTELIST", { result: result });
			}
		});
};

	exports.Update_Archivement = function (socket, userInfo) {
		var collection = database.collection("User_Data");
		var query = { userid: userInfo.userid };

		let archMoney = fixNumber(userInfo.archivement_money);
		let archIndex = fixNumber(userInfo.archivement_index);
		collection.findOne(query, function (err, result) {
			if (err){} //  gamelog.showlog("error16", err);
			else {
				result.archivement[archIndex] = 1;
				let points = fixNumber(result.points) + fixNumber(archMoney);
				collection.updateOne(
					query,
					{ $set: { points: points, archivement: result.archivement } },
					function (err) {
						if (err) throw err;
						else
							socket.emit("UPDATE_USER_ARCHIVEMENT", {
								result: points,
								arch: result.archivement,
							});
					}
				);
			}
		});
	// }
};
