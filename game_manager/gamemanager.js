var roomlist = [];
var tourlist = [];
var database = null;
var io;
var poker = require("../module/poker-engine");
var Ranker = require("../module/handranker");
var botlog = require('./gamelog');
var showWinDelay = 1000;
var BotManager = require("./botmanager.js");
const percentIncrease = (partnumber, totalnumber) =>
	Math.ceil((partnumber / totalnumber) * 100);
var roommanager = require("../room_manager/roommanager");

// player.leaveenterflag
// (0: sit-down state: sitting in a seat but not playing)
// (1: The status taken a part in game directly)
// player.getCorrectSeatnumber
// (0: has not a seat number)
// (1: has a seat number)

exports.initdatabase = function (db) {
	database = db;
	// setTimeout(() => {
	//     setTournaments();
	// }, 6000);

	setTimeout(() => {
		let collection = database.collection("User_Data");
		collection.find().toArray(function (err, docs) {
			if (!err) {
				if (docs.length > 0) {
					for (let i = 0; i < docs.length; i++) {
						const element = docs[i];
						let j = element.photo.indexOf("undefine");
						let photoType = element.photo_type;
						if (j > -1) {
							photoType = 0;
						}
						let query = { userid: element.userid };
						collection.findOne(query, function (err, result) {
							if (err) { } //gamelog.showlog("error1", err);
							else {
								if (result != null) {
									let Friends = result.friends;
									let buff = Friends.filter(
										(x) => x.accepted == true || x.accepted == "true"
									);

									let arr1 = Friends.filter((o, index) =>
										Friends.find(
											(_o, _index) => o.id === _o.id && index !== _index
										)
									);
									let arr2 = Friends.filter(
										(o, index) =>
											!Friends.find(
												(_o, _index) => o.id === _o.id && index !== _index
											)
									);
									if (arr1.length > 1) arr2.push(arr1[0]);
									setTimeout(() => {
										collection.updateOne(
											query,
											{
												$set: {
													buddies: buff.length,
													friends: arr2,
												},
											},
											function (err) {
												if (err) throw err;
											}
										);
										collection.updateOne(
											query,
											{
												$set: {
													connect: "",
													connected_room: "",
												},
											},
											function (err) {
												if (err) throw err;
											}
										);
										// let results = "";
										// if(result.photo == "") results = "";
										// else results = result.photo.split('/')[3];
										// gamelog.showlog(results);
										// collection.updateOne(query, {
										//     $set: {
										//         archivement: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
										//     }
										// }, function (err) {
										//     if (err) throw err;
										// });
									}, 100);
								}
							}
						});
						collection.updateOne(
							query,
							{
								$set: {
									photo_type: photoType,
									connected_room: "",
									connect: "",
								},
							},
							function (err) {
								if (err) throw err;
							}
						);
					}
				}
				// for (let index = 0; index < roomlist.length; index++) {
				//     const element = roomlist[index];
				//     if (element.playerlist.length == 0) {
				//         roomlist.splice(index, 1);
				//         break;
				//     }
				// }
			}
		});
		// collection.find().toArray(function (err, docs) {
		//     if (!err) {
		//         if (docs.length > 0) {
		//             for (let i = 0; i < docs.length; i++) {
		//                 const element = docs[i];
		//                 let points = 0;
		//                 let level = Math.floor(element.level); gamelog.showlog(element.points.toString().length)
		//                 if (element.points === null || element.points === undefined ||
		//                     element.points.toString().length == 0) {
		//                     points = 100000000;
		//                 }
		//                 else {
		//                     points = roundNum(element.points);
		//                 }
		//                 // gamelog.showlog("i found");
		//                 let query = { userid: element.userid };
		//                 collection.updateOne(query, {
		//                     $set: {
		//                         points: points,
		//                         level: level
		//                     }
		//                 }, function (err) {
		//                     if (err) throw err;
		//                 });
		//             }
		//         }
		//     }
		// });
		// collection.updateMany({},
		//     { $set: { "points": 500000000 } })

		// setInterval(() => {
		//     collection.find().toArray(function (err, docs) {
		//         if (!err) {
		//             if (docs.length > 0) {
		//                 for (let i = 0; i < docs.length; i++) {
		//                     const element = docs[i];
		//                     let points = 0;
		//                     let level = Math.floor(element.level);
		//                     if (element.points === null || element.points === undefined ||
		//                         element.points.toString().length > 18) {
		//                         points = 0;
		//                     }
		//                     // gamelog.showlog("i found");
		//                     let query = { userid: element.userid };
		//                     collection.updateOne(query, {
		//                         $set: {
		//                             points: points,
		//                             level: level
		//                         }
		//                     }, function (err) {
		//                         if (err) throw err;
		//                     });
		//                 }
		//             }
		//         }
		//     });
		// }, 10000);
	}, 3000);

	// setTimeout(() => {
	//     var hand1 = { id: 1, cards: ['AC', '4C'] }; // tie
	//     var hand2 = { id: 2, cards: ['AD', 'AD'] }; // tie
	//     var hand3 = { id: 3, cards: ['KH', 'JC'] }; // win
	//     var board = ['TH', '9H', 'TC'];
	//     var hands = [hand1, hand2, hand3];
	//     var results = Ranker.orderHands(hands, board);
	//     gamelog.showlog(results[0][0])
	// }, 1000);
};

function roundNum(n) {
	let units = n.toString().length;
	let remains = 0;
	if (units % 3 == 0) remains = (units / 3 - 1) * 3;
	else remains = units - (units % 3);
	let a = Math.trunc(n / 10 ** remains) * 10 ** remains;
	return a;
}
exports.setsocketio = function (socketio) {
	io = socketio;
};

exports.getAllTables = function () {
	return roomlist;
};
exports.get = function () {
	return roomlist;
};
exports.getroomIndex = function (roomid) {
	for (let index = 0; index < roomlist.length; index++) {
		const element = roomlist[index];
		if (element.roomid == roomid)
			if (element.roomid == roomid) {
				return index;
			}
	}
};
exports.addroom = function (
	r_roomID,
	r_title,
	r_seatlimit,
	r_status,
	r_game_mode,
	r_buyin_min,
	r_buyin_max,
	SB,
	BB
) {
	let inputplayerlist = [];
	let waitPlayerlist = [];
	let currenttable = poker.newTable({
		minBlind: SB,
		maxBlind: BB,
		maxPlayers: r_seatlimit,
		tableID: r_roomID,
	});

	let gameobject = {
		roomid: r_roomID,
		title: r_title,
		smallBlind: SB,
		bigBlind: BB,
		buyin_min: r_buyin_min,
		buyin_max: r_buyin_max,
		seatlimit: r_seatlimit,
		status: r_status,
		gamemode: r_game_mode,
		playerlist: inputplayerlist,
		waitPlayerlist: waitPlayerlist,
		table: currenttable,
		currenttimeout: null,
		turn: false,
		levelTimeout: null,
		level: 1,
		breakTimeout: null,
		isBreakTime: false,
		totalPot: 0,
		mainPots: [],
		startflag: 0,
		roundstarttime: null,
		legalbet: 0,
		played: 0,
		removed: false,
	};
	//roomlist = [];
	roomlist.push(gameobject);
};
exports.getPlayersSitted = function (room) {
	let sitted_players = 0;
	for (let i = 0; i < room.playerlist.length; i++) {
		//const element = room.playerlist[i];
		// if(element.getCorrectSeatnumber == 1)
		// {
		//     sitted_players++;
		// }
		sitted_players++;
	}
	return sitted_players;
};

exports.getPlayersViewed = function (room) {
	let viewed_players = 0;
	for (let i = 0; i < room.playerlist.length; i++) {
		const element = room.playerlist[i];
		if (element.getCorrectSeatnumber == 0) {
			viewed_players++;
		}
	}
	return viewed_players;
};
exports.playerenterroom = function (
	roomid,
	username,
	balance,
	avatar,
	photoURL,
	photoType,
	socket
) {
	socket.room = "r" + roomid;
	socket.join("r" + roomid);
	socket.username = username;
	if (roomlist.length > 0) {
		for (let index = 0; index < roomlist.length; index++) {
			if (roomlist[index].roomid == roomid) {
				let maxPlayers = roomlist[index].seatlimit;
				let seatnumber;
				let flag = 0;
				let getCorrectSeatnumber = 0;
				//if (roomlist[index].playerlist.length < maxPlayers) {
				if (roomlist[index].playerlist.length == -1) {
					seatnumber = roomlist[index].table.addPlayer({
						playerName: username,
						chips: 0,
						avatar: avatar,
						photoUrl: photoURL,
						photoType: photoType,
					});
					flag = 1;
					getCorrectSeatnumber = 1;
					let mydata = {
						result: "success",
						seated: true,
					};
					socket.emit("REQ_ENTER_ROOM_RESULT", mydata);
				} else {
					let positions = [];
					let pos = 0;
					for (let i = 0; i < roomlist[index].playerlist.length; i++) {
						const element = roomlist[index].playerlist[i];
						positions.push(element.seatnumber);
					}
					while (true) {
						if (
							roomlist[index].table.players[pos] == undefined ||
							roomlist[index].table.players[pos].playerName == "Empty seat"
						) {
							let a = positions.filter((x) => x == pos);
							if (a.length == 0) {
								break;
							} else pos++;
						} else {
							pos++;
						}
					}
					seatnumber = pos;
					flag = 0;
					getCorrectSeatnumber = 0;
					let mydata = {
						result: "success",
						roomid: roomid,
						smallBlind: roomlist[index].smallBlind,
						bigBlind: roomlist[index].bigBlind,
						seated: false,
						seatnumber: seatnumber,
					};
					if (roomlist[index].gamemode == "tournament") {
						getCorrectSeatnumber = 1;
					}
					socket.emit("REQ_ENTER_ROOM_RESULT", mydata);
				}
				// } else {
				//     // No empty seat
				//     // Move to booking status
				//     seatnumber = maxPlayers;
				//     flag = 0;
				//     getCorrectSeatnumber = 0;
				//     let mydata = {
				//         result: "failed"
				//     };
				//     socket.emit('REQ_ENTER_ROOM_RESULT', mydata);
				// }
				if (roomlist[index].gamemode == "tournament") {
					balance = roomlist[index].buyin_min;
				} else balance = 0;
				let player = {
					username: username,
					balance: balance,
					avatar: avatar,
					photoUrl: photoURL,
					photoType: photoType,
					seatnumber: seatnumber,
					gift: "",
					foldedCount: 0,
					timebank: 20000,
					leaveenterflag: flag,
					getCorrectSeatnumber: getCorrectSeatnumber,
					buyinflag: 1,
					waitforbb: 1,
					showcards: 0,
					mode: "normal",
					moveroom: 0,
				};
				// if (seatnumber >= maxPlayers) {
				//     roomlist[index].waitPlayerlist.push(player);
				//     return;
				// }
				// else
				// {
				roomlist[index].playerlist.push(player);
				getCurrentRoomStatus(index, socket);
				let takeSeats = [];
				for (let i = 0; i < roomlist[index].playerlist.length; i++) {
					const element = roomlist[index].playerlist[i];

					if (
						element.getCorrectSeatnumber == 1 &&
						element.leaveenterflag == 0
					) {
						takeSeats.push(element);
					}
				}
				setTimeout(() => {
					let emitdata = {
						result: takeSeats,
					};
					io.sockets.in("r" + roomid).emit("TAKE_SEAT_PLAYERS", emitdata);
					if (roomlist[index].gamemode == "tournament") {
						let sitdown = {
							room_id: roomid,
							player_id: username,
							position: seatnumber,
							photoUrl: photoURL,
							photoType: photoType,
						};
						exports.SitDown(socket, sitdown);
					}
				}, 50);
				//}
			}
		}
	}
};
exports.playerenterroom_bot = function (roomid, username, balance, avatar) {
	if (roomlist.length > 0) {
		for (let index = 0; index < roomlist.length; index++) {
			if (roomlist[index].roomid == roomid) {
				let maxPlayers = roomlist[index].seatlimit;
				let seatnumber;
				if (roomlist[index].playerlist.length < maxPlayers) {
					let positions = [];
					let pos = 0;
					for (let i = 0; i < roomlist[index].playerlist.length; i++) {
						const element = roomlist[index].playerlist[i];
						positions.push(element.seatnumber);
					}
					while (true) {
						if (
							roomlist[index].table.players[pos] == undefined ||
							roomlist[index].table.players[pos].playerName == "Empty seat"
						) {
							let a = positions.filter((x) => x == pos);
							if (a.length == 0) {
								break;
							} else pos++;
						} else {
							pos++;
						}
					}
					seatnumber = pos;
				}

				let player = {
					username: username,
					balance: balance,
					avatar: avatar,
					photoUrl: "",
					photoType: 0,
					seatnumber: seatnumber,
					gift: "",
					timebank: 20000,
					leaveenterflag: 0,
					getCorrectSeatnumber: 1,
					buyinflag: 1,
					waitforbb: 2,
					showcards: 0,
					mode: "bot",
					moveroom: 0,
				};
				let seatedPlayers = roomlist[index].playerlist.filter(
					(x) => x.leaveenterflag == 1
				);
				let checknum = 0;
				if (roomlist[index].gamemode == "tournament") checknum = 4;
				else checknum = 2;
				if (seatedPlayers.length < checknum) {
					seatnumber = roomlist[index].table.addPlayer({
						playerName: username,
						chips: balance,
						avatar: avatar,
						photoUrl: "",
						photoType: 0,
					});
					player.leaveenterflag = 1;
					player.waitforbb = 1;
					player.seatnumber = seatnumber;
				}
				setTimeout(() => {
					roomlist[index].playerlist.push(player);
					let checknum = 0;
					if (roomlist[index].gamemode == "tournament") checknum = 3;
					else checknum = 1;
					if (seatedPlayers.length == checknum) {
						if (roomlist[index].status == 0) {
							roundstart(index);
							roomlist[index].status = 1;
						} else {
							if (roomlist[index].gamemode == "tournament") levelTimer(index);
							roomlist[index].table.initNewRound();
						}
					}
				}, 100);
				let option = {
					roomid: roomid,
					username: username,
					balance: balance,
					avatar: avatar,
					seatnumber: seatnumber,
				};
				BotManager.addBot(option);
				setTimeout(() => {
					let mydata = {
						roomid: roomlist[index].roomid,
						seatlimit: roomlist[index].seatlimit,
						gamemode: roomlist[index].gamemode,
						status: roomlist[index].status,
						totalPot: roomlist[index].totalPot,
						table: roomlist[index].table,
						played: roomlist[index].played,
						level: roomlist[index].level,
						playerlist: roomlist[index].playerlist,
					};
					let useridArray = [];
					roomlist[index].playerlist.forEach((element) => {
						useridArray.push(element.username);
					});
					getUsername(useridArray, function (data) {
						let usernames = [];
						data.forEach((d) => {
							usernames.push({ userid: d.userid, username: d.username });
						});
						io.sockets
							.in("r" + roomlist[index].roomid)
							.emit("CURRENT_ROOM_NAMES", { result: usernames });
					});
					io.sockets
						.in("r" + roomlist[index].roomid)
						.emit("CURRENT_ROOM_STATUS", mydata);
					let takeSeats = [];
					for (let i = 0; i < roomlist[index].playerlist.length; i++) {
						const element = roomlist[index].playerlist[i];

						if (
							element.getCorrectSeatnumber == 1 &&
							element.leaveenterflag == 0
						) {
							takeSeats.push(element);
						}
					}

					let emitdata = {
						result: takeSeats,
					};
					io.sockets.in("r" + roomid).emit("TAKE_SEAT_PLAYERS", emitdata);
				}, 300);
				break;
			}
		}
	}
};
exports.SitDown = function (socket, info) {
	setTimeout(() => {
		let roomid = parseInt(info.room_id);
		let username = info.player_id;
		let seat = parseInt(info.position);
		//gamelog.showlog("-> current room users");
		for (let index = 0; index < roomlist.length; index++) {
			if (roomlist[index].roomid == roomid) {
				for (let i = 0; i < roomlist[index].playerlist.length; i++) {
					const element = roomlist[index].playerlist[i];
					//gamelog.showlog("sitdown ??? username:", element.username);
					if (element.username == username) {
						if (
							element.getCorrectSeatnumber == 1 &&
							element.leaveenterflag == 0
						) {
							return;
						}
						//gamelog.showlog("sitdown");
						element.seatnumber = seat;
						element.getCorrectSeatnumber = 1;
						element.leaveenterflag = 0;

						let emitdata = {
							result: "success",
							username: username,
							avatar: element.avatar,
							seat: seat,
							photoUrl: info.photoUrl,
							photoType: info.photoType,
						};
						io.sockets
							.in("r" + roomlist[index].roomid)
							.emit("REQ_TAKE_SEAT_RESULT", emitdata);

						if (roomlist[index].gamemode == "tournament") {
							var mydata = {
								roomid: roomlist[index].roomid,
								seatlimit: roomlist[index].seatlimit,
								gamemode: roomlist[index].gamemode,
								status: roomlist[index].status,
								totalPot: roomlist[index].totalPot,
								table: roomlist[index].table,
								played: roomlist[index].played,
								level: roomlist[index].level,
								playerlist: roomlist[index].playerlist,
							};
							if (socket != null) {
								let useridArray = [];
								roomlist[index].playerlist.forEach((element) => {
									useridArray.push(element.username);
								});
								getUsername(useridArray, function (data) {
									let usernames = [];
									data.forEach((d) => {
										//gamelog.showlog(d.username);
										usernames.push({ userid: d.userid, username: d.username });
									});
									io.sockets
										.in("r" + roomlist[index].roomid)
										.emit("CURRENT_ROOM_NAMES", { result: usernames });
								});
								io.sockets
									.in("r" + roomlist[index].roomid)
									.emit("CURRENT_ROOM_STATUS", mydata);
							}
						}
						break;
					}
				}
			}
		}
	}, 1000);
};
exports.SitUp = function (socket, info) {
	//gamelog.showlog("sit up");
	let roomid = parseInt(info.room_id);
	let username = info.player_id;
	let seat = parseInt(info.position);

	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == roomid) {
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				const element = roomlist[index].playerlist[i];
				if (element.username == username) {
					element.seatnumber = seat;
					element.getCorrectSeatnumber = 0;
					element.leaveenterflag = 0;
					let emitdata = {
						result: "success",
						username: username,
						avatar: element.avatar,
						seat: seat,
						photoUrl: element.photoUrl,
						photoType: element.photoType,
					};
					io.sockets
						.in("r" + roomlist[index].roomid)
						.emit("REQ_CANCEL_TAKE_SEAT_RESULT", emitdata);
				}
			}
		}
	}
};
exports.SitOut = function (socket, data) {
	//gamelog.showlog("sitout", data);
	let roomid = parseInt(data.room_id);
	let username = data.player_id;
	let seat = parseInt(data.position);
	let status = false;
	if (data.sitout == "True") status = true;
	else status = false;
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == roomid) {
			let player = roomlist[index].table.getPlayerByName(username);
			if (player == undefined || player == null) return;
			if (roomlist[index].table.started) {
				player.isSeated = !status;
			} else {
				player.isSeated = !status;
				if (status == false) {
					let seatedPlayers = roomlist[index].table.players.filter(
						(x) => !x.isEmptySeat
					);
					if (seatedPlayers.length == 1) {
						exports.removetimeout(index);
						setTimeout(() => {
							getCurrentRoomStatus(index, socket);
							setTimeout(() => {
								if (roomlist[index].status == 0) {
									roundstart(index);
									roomlist[index].status = 1;
								} else {
									if (roomlist[index].gamemode == "tournament")
										levelTimer(index);
									roomlist[index].table.initNewRound();
								}
							}, 50);
						}, 50);
					}
				}
			}
			setTimeout(() => {
				io.sockets.in("r" + data.room_id).emit("REQ_SIT_OUT_RESULT", data);
			}, 100);
		}
	}
};
exports.CheckSitout = function (index, playerid) {
	var player = roomlist[index].table.getPlayerByName(playerid);
	if (player) {
		let emitdata = {
			roomid: roomlist[index].roomid,
			userid: playerid,
		};

		io.in("r" + roomlist[index].roomid).emit("CHECK_SIT_OUT", emitdata);
	}
};

function getCurrentRoomStatus(index, socket) {
	var mydata = {
		roomid: roomlist[index].roomid,
		seatlimit: roomlist[index].seatlimit,
		gamemode: roomlist[index].gamemode,
		status: roomlist[index].status,
		totalPot: roomlist[index].totalPot,
		table: roomlist[index].table,
		played: roomlist[index].played,
		level: roomlist[index].level,
		playerlist: roomlist[index].playerlist,
	};
	if (socket != null) {
		let useridArray = [];
		roomlist[index].playerlist.forEach((element) => {
			useridArray.push(element.username);
		});
		getUsername(useridArray, function (data) {
			let usernames = [];
			data.forEach((d) => {
				//gamelog.showlog(d.username);
				usernames.push({ userid: d.userid, username: d.username });
			});
			io.sockets
				.in("r" + roomlist[index].roomid)
				.emit("CURRENT_ROOM_NAMES", { result: usernames });
		});
		io.sockets
			.in("r" + roomlist[index].roomid)
			.emit("CURRENT_ROOM_STATUS", mydata);
	}

	setTimeout(() => {
		let takeSeats = [];
		for (let i = 0; i < roomlist[index].playerlist.length; i++) {
			const element = roomlist[index].playerlist[i];

			if (element.getCorrectSeatnumber == 1 && element.leaveenterflag == 0) {
				takeSeats.push(element);
			}
		}
		let emitdata = {
			result: takeSeats,
		};
		if (socket != null) socket.emit("TAKE_SEAT_PLAYERS", emitdata);
	}, 100);
}
exports.WaitForBB = function (socket, data) {
	let roomid = parseInt(data.room_id);
	let userid = data.player_id;
	let seat = parseInt(data.position);
	let status = false;

	if (data.waitforBB == "True") status = true;
	else status = false;
	//status = false;
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == roomid) {
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				let element = roomlist[index].playerlist[i];
				if (element.username == userid) {
					if (status) {
						element.waitforbb = 0;
						element.buyinflag = 1;
					} else {
						element.waitforbb = 2;
						element.buyinflag = 1;
					}
				}
			}
		}
	}
};

function roundstart(index) {
	if (roomlist[index].table.started == false) {
		BotManager.roundstart(index);
		//gamelog.showlog(
		//	"room",
		//	index,
		//	">>>",
		//	roomlist[index].playerlist.length,
		//	roomlist[index].table.players.length
		//);
		roomlist[index].table.on("roundDeal", function () {
			roomlist[index].legalbet = 0;
			roomlist[index].mainPots = [];
			showWinDelay = 1000;
			let emitdata = {
				roomid: roomlist[index].roomid,
				roundname: "Deal",
				card: [],
				pot: "" + roomlist[index].table.getRoundPot(),
			};
			gamelog.showlog("@@@@@@@@@");
			io.in("r" + roomlist[index].roomid).emit("TABLE_ROUND", emitdata);
			// for (let i = 0; i < roomlist[index].table.players.length; i++) {
			//     const element = roomlist[index].table.players[i];
			//     if (element.chips <= 0) {
			//         let collection = database.collection('User_Data');
			//         let query = { username: element.playerName };
			//         collection.findOne(query, function (err, result) {
			//             if (err){} //  gamelog.showlog("error1", err);
			//             else {
			//                 if (result != null) {
			//                     if (result.connect == "") {
			//                         LeaveUser(index, element, "normal");
			//                     }
			//                 }
			//             }
			//         });

			//     }
			// }
		});
		roomlist[index].table.on("smallBlind", function (player) {
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				let element = roomlist[index].playerlist[i];
				if (element.username == player.playerName) {
					let sb_value = player.table.smallBlind;
					roomlist[index].totalPot += sb_value;
					element.balance -= sb_value;
					let emitdata;
					let message =
						player.playerName +
						" posted small blind with $" +
						ChangeUnit(player.table.smallBlind);
					if (player.missBlind > sb_value) {
						let buff = player.missBlind - sb_value;
						let pos = player.getIndex();
						roomlist[index].table.game.bets[pos] += sb_value;

						roomlist[index].totalPot += buff;
						player.chips -= buff;
						element.balance -= buff;

						element.waitforbb = 1;

						emitdata = {
							result: "waitforbb",
							smallBlind: player.table.smallBlind,
							playerName: player.playerName,
							playerPosition: player.getIndex(),
							playerCards: player.cards,
							playerChips: player.chips,
							showAction: "SBlind",
							chips: player.missBlind,
							totalpot: roomlist[index].totalPot,
							message: message,
						};
					} else {
						emitdata = {
							result: "sb",
							smallBlind: player.table.smallBlind,
							playerName: player.playerName,
							playerPosition: player.getIndex(),
							playerCards: player.cards,
							playerChips: player.chips,
							message: message,
						};
					}
					let useridArray = [];
					roomlist[index].playerlist.forEach((element) => {
						useridArray.push(element.username);
					});
					getUsername(useridArray, function (data) {
						let usernames = [];
						data.forEach((d) => {
							usernames.push({ userid: d.userid, username: d.username });
						});
						io.sockets
							.in("r" + roomlist[index].roomid)
							.emit("SmallBlind_Deal", emitdata);
						io.sockets
							.in("r" + roomlist[index].roomid)
							.emit("CURRENT_ROOM_NAMES", { result: usernames });
					});
				}
			}
		});
		roomlist[index].table.on("bigBlind", function (player) {
			roomlist[index].totalPot += player.table.bigBlind;
			let message =
				player.playerName +
				" posted big blind with $" +
				ChangeUnit(player.table.bigBlind);
			let emitdata = {
				bigBlind: player.table.bigBlind,
				playerName: player.playerName,
				playerPosition: player.getIndex(),
				playerCards: player.cards,
				playerChips: player.chips,
				dealer: player.table.dealer,
				table: roomlist[index].table,
				message: message,
			};
			io.sockets
				.in("r" + roomlist[index].roomid)
				.emit("BigBlind_Deal", emitdata);

			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				let element = roomlist[index].playerlist[i];
				if (element.username == player.playerName) {
					if (element.waitforbb == 2) {
						element.waitforbb = 1;
					}
				} else {
					let p = roomlist[index].table.getPlayerByName(element.username);
					if (p) {
						let pos = p.getIndex();
						if (pos != roomlist[index].table.sBPos && p.missBlind > 0) {
							let num = p.missBlind;
							roomlist[index].table.game.bets[pos] +=
								roomlist[index].table.bigBlind;
							roomlist[index].totalPot += num;
							p.chips -= num;
							element.balance -= num;

							p.missBlind = 0;
							element.waitforbb = 1;
							let message1 =
								element.username +
								" called with $" +
								ChangeUnit(player.table.bigBlind) +
								"for waitforbb";
							let emitdata = {
								roomid: roomlist[index].roomid,
								userid: element.username,
								position: pos,
								balance: p.chips,
								showAction: "call",
								chips: num,
								totalpot: roomlist[index].totalPot,
								message: message1,
							};
							io.sockets
								.in("r" + roomlist[index].roomid)
								.emit("WAIT_FOR_BB", emitdata);
						}
					}
				}
			}

			setTimeout(function () {
				roomlist[index].table.NextPlayer();
			}, 500);
		});
		roomlist[index].table.on("turn", function (player) {
			setTimeout(() => {
				let emitdata = {
					roomid: roomlist[index].roomid,
					name: player.playerName,
					position: player.getIndex(),
					chips: player.chips,
					timeBank: player.timebank,
					thoughtTime: 12,
					currentBet: player.GetBet(),
					maxBet: player.table.getMaxBet(),
					legalBet: roomlist[index].legalbet,
					roundBet: player.GetRoundBet(),
					isFolded: player.folded,
					isAllIn: player.isAllIn,
					isSeated: player.isSeated,
					isEmptySeat: player.isEmptySeat,
					table: player.table,
				};
				io.sockets.in("r" + roomlist[index].roomid).emit("turn", emitdata);
				// Check thought-time
				roomlist[index].turn = true;
				let thoughtTime = 12000;
				let timebank = player.timebank * 1000;
				let timeout = thoughtTime + timebank;

				let seatedPlayers = roomlist[index].playerlist.filter(
					(x) => x.leaveenterflag == 1
				);
				let seatBots = seatedPlayers.filter((x) => x.mode == "bot");
				let seatnormals = seatedPlayers.filter((x) => x.mode == "normal");
				let waittime = 0;
				if (seatBots.length > 0 && seatnormals.length > 1) {
					for (i = 0; i < seatBots.length; i++) {
						(function (x) {
							let b = roomlist[index].table.getPlayerByName(
								seatBots[x].username
							);
							if (b && b == player) {
								setTimeout(function () {
									//gamelog.showlog("leave bot****");
									exports.Leave(null, {
										room_id: roomlist[index].roomid,
										player_id: seatBots[x].username,
										position: seatBots[x].seatnumber,
										action: "leave",
									});
								}, 80 * x);
							}
						})(i);
					}
					// waittime = 80 * seatBots.length;
				}

				roomlist[index].currenttimeout = setTimeout(function () {
					if (player.GetBet() < player.table.getMaxBet()) {
						exports.fold(index, player.playerName);
						let j = null;
						for (let i = 0; i < roomlist[index].playerlist.length; i++) {
							let element = roomlist[index].playerlist[i];
							if (element.username == player.playerName) {
								element.balance = 0;
								j = i;
								element.foldedCount++;
								if (element.foldedCount == 1) {
									//exports.CheckSitout(index, player.playerName);
									LeaveUser(index, player, element.mode);
								}
							}
						}
						setTimeout(() => {
							if (roomlist[index].gamemode == "tournament") {
								if (roomlist[index].playerlist != undefined) {
									if (roomlist[index].playerlist[j].mode == undefined)
										roomlist[index].playerlist[j].mode = "bot";
									LeaveUser(index, player, roomlist[index].playerlist[j].mode);
								}
							}
							// else {
							//     if (roomlist[index].playerlist[j].mode != 'bot') {
							//         gamelog.showlog("CheckSitout > ", player.playerName);
							//         exports.CheckSitout(index, player.playerName);
							//     }
							// }
						}, 50);
					} else {
						exports.Check(index, player.playerName);
					}
					player.updateTimebank(0);
					clearTimeout(roomlist[index].currenttimeout);
				}, timeout);
			}, 100);
		});
		roomlist[index].table.on(
			"dealCards",
			function (boardCardCount, currnt_bets) {
				let mainpots = exports.roundMainPots(currnt_bets);
				roomlist[index].mainPots = exports.getMainPots(
					roomlist[index].mainPots,
					mainpots
				);
				let emitdata = null;
				if (roomlist[index].table != undefined) {
					switch (roomlist[index].table.game.roundName) {
						case "Flop":
							roomlist[index].legalbet = 0;
							let board1 = roomlist[index].table.game.board;
							let hands1 = [];
							for (let i = 0; i < roomlist[index].table.players.length; i++) {
								const element = roomlist[index].table.players[i];
								if (element.cards.length == 2) {
									let _hand = {
										id: i,
										cards: element.cards,
									};
									hands1.push(_hand);
								}
							}
							let handStrengths1 = Ranker.orderHands(hands1, board1);
							emitdata = {
								roomid: roomlist[index].roomid,
								roundname: "Flop",
								card: roomlist[index].table.game.board,
								pot: "" + roomlist[index].table.getRoundPot(),
								mainpots: roomlist[index].mainPots,
								handStrengths: handStrengths1,
							};
							setTimeout(() => {
								roomlist[index].table.setCurrentPlayerToSmallBlind();
							}, 1000);
							break;
						case "Turn":
							roomlist[index].legalbet = 0;
							let board2 = roomlist[index].table.game.board;
							let hands2 = [];
							for (let i = 0; i < roomlist[index].table.players.length; i++) {
								const element = roomlist[index].table.players[i];
								if (element.cards.length == 2) {
									let _hand = {
										id: i,
										cards: element.cards,
									};
									hands2.push(_hand);
								}
							}
							let handStrengths2 = Ranker.orderHands(hands2, board2);
							emitdata = {
								roomid: roomlist[index].roomid,
								roundname: "Turn",
								card: roomlist[index].table.game.board,
								pot: "" + roomlist[index].table.getRoundPot(),
								mainpots: roomlist[index].mainPots,
								handStrengths: handStrengths2,
							};

							setTimeout(() => {
								roomlist[index].table.setCurrentPlayerToSmallBlind();
							}, 1000);
							break;
						case "River":
							roomlist[index].legalbet = 0;
							let board3 = roomlist[index].table.game.board;
							let hands3 = [];
							for (let i = 0; i < roomlist[index].table.players.length; i++) {
								const element = roomlist[index].table.players[i];
								if (element.cards.length == 2) {
									let _hand = {
										id: i,
										cards: element.cards,
									};
									hands3.push(_hand);
								}
							}
							let handStrengths3 = Ranker.orderHands(hands3, board3);
							emitdata = {
								roomid: roomlist[index].roomid,
								roundname: "River",
								card: roomlist[index].table.game.board,
								pot: "" + roomlist[index].table.getRoundPot(),
								mainpots: roomlist[index].mainPots,
								handStrengths: handStrengths3,
							};

							setTimeout(() => {
								roomlist[index].table.setCurrentPlayerToSmallBlind();
							});
							break;
						case "Showdown":
							if (roomlist[index].table.game.board.length == 5) {
								if (boardCardCount == 5) {
									showWinDelay = 1500;
								}
								emitdata = {
									roomid: roomlist[index].roomid,
									roundname: "Showdown",
									card: roomlist[index].table.game.board,
									pot: "" + roomlist[index].table.getRoundPot(),
									mainpots: roomlist[index].mainPots,
								};
								//gamelog.showlog("@@@@@@@@@");
								io.in("r" + roomlist[index].roomid).emit(
									"TABLE_ROUND",
									emitdata
								);
							}
							break;
					}
				}
				if (emitdata != null) {
					if (emitdata.roundname != "Showdown") {
						setTimeout(() => {
							if (!roomlist[index].table.onlyoneplayerremaining()) {
								//gamelog.showlog("@@@@@@@@@");
								io.in("r" + roomlist[index].roomid).emit(
									"TABLE_ROUND",
									emitdata
								);
							}
						}, 500);
					}
				}
			}
		);
		roomlist[index].table.on("roundShowdown", function (currnt_bets) {
			let mainpots = exports.roundMainPots(currnt_bets);
			roomlist[index].mainPots = exports.getMainPots(
				roomlist[index].mainPots,
				mainpots
			);
			let boardCards = [];
			if (roomlist[index].table.game.board != undefined) {
				boardCards = roomlist[index].table.game.board;
			}
			let emitdata = {
				roomid: roomlist[index].roomid,
				roundname: "Showdown",
				card: boardCards,
				pot: "" + roomlist[index].table.getRoundPot(),
				mainpots: roomlist[index].mainPots,
			};
			//gamelog.showlog("@@@@@@@@@");
			io.in("r" + roomlist[index].roomid).emit("TABLE_ROUND", emitdata);
		});
		roomlist[index].table.on("win", function (winner, prize) {
			setTimeout(() => {
				let handrankVal = 0;
				if (!isNaN(winner.hand.rank)) {
					handrankVal = winner.hand.rank;
				}
				let board4 = roomlist[index].table.game.board;
				let hands4 = [];
				if (winner.cards.length == 2) {
					let _hand = {
						id: winner.getIndex(),
						cards: winner.cards,
					};
					hands4.push(_hand);
				}
				let handStrengths4 = null;
				if (board4.length >= 3)
					handStrengths4 = Ranker.orderHands(hands4, board4);
				let message =
					winner.playerName + " won $" + ChangeUnit(prize) + " with ";
				let wining_hand = winner.hand.message;
				message += wining_hand;
				let wining_cards = [];
				if (handStrengths4 != null) {
					message += ":";
					let playingcard = handStrengths4[0][0]["playingCards"];
					for (let k = 0; k < playingcard.length; k++) {
						message +=
							"(" + playingcard[k]["suit"] + ")" + playingcard[k]["rank"] + " ";
						wining_cards.push(playingcard[k]["rank"] + playingcard[k]["suit"]);
					}
				}
				let emitdata = {
					winner: winner.playerName,
					position: winner.getIndex(),
					won: prize,
					handrank: winner.hand.message,
					wincards: winner.hand.cards,
					handrankvalue: handrankVal,
					handStrength: handStrengths4,
					message: message,
				};

				for (let k = 0; k < roomlist[index].table.players.length; k++) {
					const player = roomlist[index].table.players[k];
					if (player.isEmptySeat == false && player.isSeated == true) {
						Update_level_handplayed(player.playerName);
					}
				}
				setTimeout(() => {
					Record_Won_History(
						winner.playerName,
						prize,
						wining_hand,
						wining_cards,
						handrankVal
					);
				}, 100);
				//gamelog.showlog("gameWin::");
				io.in("r" + roomlist[index].roomid).emit("TABLE_WIN", emitdata);
			}, showWinDelay);
		});
		roomlist[index].table.on("Bankrupt", function (player) {
			let j = null;
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				let element = roomlist[index].playerlist[i];
				if (element.username == player.playerName) {
					element.balance = 0;
					j = i;
				}
			}
			io.in("r" + roomlist[index].roomid).emit("Bankrupt", {
				player: player,
			});
			if (j != null) {
				if (roomlist[index].gamemode != "tournament") {
					if (roomlist[index].playerlist[j].mode == "bot") {
						roomlist[index].playerlist[j].balance = roomlist[index].buyin_min;
						player.chips = roomlist[index].buyin_min;
						player.isSeated = true;
						player.isEmptySeat = false;

						//LeaveUser(index, player, roomlist[index].playerlist[j].mode);
					}
				} else {
					LeaveUser(index, player, roomlist[index].playerlist[j].mode);
				}
			}
		});
		roomlist[index].table.on("returnChips", function (position, returnChips) {
			let emitdata = {
				position: position,
				chips: returnChips,
			};
			io.in("r" + roomlist[index].roomid).emit("RETURN_CHIPS", emitdata);
		});
		roomlist[index].table.on("gameOver", function () {
			roomlist[index].played++;
			setTimeout(() => {
				if (roomlist[index] == null) return;
				let i = -1;
				let time = 30 * roomlist[index].playerlist.length;
				let waitingtime = 0;

				setTimeout(() => {
					let checkroom = setInterval(() => {
						if (i < roomlist[index].playerlist.length) {
							i++;
							let element = roomlist[index].playerlist[i];
							if (element != undefined) {
								if (element.buyinflag == 0) {
									let player = roomlist[index].table.getPlayerByName(
										element.username
									);
									//gamelog.showlog("abcdefg", element.username);
									if (player) {
										player.isEmptySeat = false;
										player.isSeated = true;
										element.buyinflag = 1;
										//gamelog.showlog(player.playerName, "buyinFlog = 1");
									}
								}
								if (element.balance > 0) {
									if (element.leaveenterflag == 0) {
										if (element.getCorrectSeatnumber == 1) {
											if (element.waitforbb == 0) {
												//gamelog.showlog("qwewqe");
												let player = roomlist[index].table.getPlayerByName(
													element.username
												);
												if (!player) {
													let seatnumber = roomlist[index].table.addPlayer({
														playerName: element.username,
														chips: element.balance,
														avatar: element.avatar,
														photoUrl: element.photoUrl,
														photoType: element.photoType,
														position: element.seatnumber,
													});
													player = roomlist[index].table.getPlayerByName(
														element.username
													);
													player.isEmptySeat = true;
													player.isSeated = false;
													element.seatnumber = seatnumber;
												}
											} else if (element.waitforbb == 2) {
												//gamelog.showlog("qwewqe2222");
												let seatnumber;
												if (element.mode == "bot") {
													if (
														element.moveroom > 0 &&
														roomlist[index].roomid == element.moveroom
													) {
														seatnumber = roomlist[index].table.addPlayer({
															playerName: element.username,
															chips: element.balance,
															avatar: element.avatar,
															position: element.seatnumber,
														});
													} else if (element.moveroom == 0) {
														seatnumber = roomlist[index].table.addPlayer({
															playerName: element.username,
															chips: element.balance,
															avatar: element.avatar,
															position: element.seatnumber,
														});
													}
												} else {
													if (
														element.moveroom == 0 ||
														(element.moveroom > 0 &&
															roomlist[index].roomid == element.moveroom)
													) {
														seatnumber = roomlist[index].table.addPlayer({
															playerName: element.username,
															chips: element.balance,
															avatar: element.avatar,
															photoUrl: element.photoUrl,
															photoType: element.photoType,
															position: element.seatnumber,
														});
													}
												}
												let player = roomlist[index].table.getPlayerByName(
													element.username
												);
												player.isEmptySeat = false;
												player.isSeated = true;
												element.seatnumber = seatnumber;
												element.moveroom = 0;
												element.leaveenterflag = 1;
											}
										}
									}
								}
							}
						} else {
							clearInterval(checkroom);
						}
					}, 100);
					roomlist[index].totalPot = 0;
					let Reposition_time = time;
					if (roomlist[index].playerlist.length > 1) {
						Reposition_time = showWinDelay + 1500;
					}
					setTimeout(() => {
						let emitdata = {
							played: roomlist[index].played,
							level: roomlist[index].level,
							table: roomlist[index].table,
						};
						let useridArray = [];
						roomlist[index].playerlist.forEach((element) => {
							useridArray.push(element.username);
						});
						getUsername(useridArray, function (data) {
							let usernames = [];
							data.forEach((d) => {
								usernames.push({ userid: d.userid, username: d.username });
							});
							io.in("r" + roomlist[index].roomid).emit(
								"TABLE_REPOSITION",
								emitdata
							);
							io.in("r" + roomlist[index].roomid).emit("CURRENT_ROOM_NAMES", {
								result: usernames,
							});
						});

						let takeSeats = [];
						for (let i = 0; i < roomlist[index].playerlist.length; i++) {
							const element = roomlist[index].playerlist[i];

							if (
								element.getCorrectSeatnumber == 1 &&
								element.leaveenterflag == 0
							) {
								takeSeats.push(element);
							}
						}
						setTimeout(() => {
							let emitdata = {
								result: takeSeats,
							};
							io.sockets
								.in("r" + roomlist[index].roomid)
								.emit("TAKE_SEAT_PLAYERS", emitdata);
						}, 10);
					}, Reposition_time);
					let seatedPlayers = roomlist[index].playerlist.filter(
						(x) => x.leaveenterflag == 1
					);
					let seatnormals = seatedPlayers.filter((x) => x.mode == "normal");
					let seatBots = roomlist[index].playerlist.filter(
						(x) => x.mode == "bot"
					);
					//gamelog.showlog("seatedplayer >>>> ", seatedPlayers.length);
					//gamelog.showlog("players >>>> ", roomlist[index].playerlist.length);
					if (seatedPlayers.length > 1 /*&& seatnormals.length > 0*/) {
						let time = showWinDelay + 1000;
						setTimeout(() => {
							if (roomlist[index].gamemode == "tournament") {
								if (roomlist[index] != null) {
									checkStartgame(index);
								}
							} else {
								roomlist[index].table.initNewRound();
							}
						}, time);
					}

					gamelog.showlog(seatnormals.length, "||", seatBots.length);
					if (seatBots.length == 0 && seatnormals.length == 1) {
						roommanager.BotsCreating(
							roomlist[index].roomid,
							roomlist[index].buyin_min,
							roomlist[index].seatlimit
						);
					}
					// else if (seatBots.length > 0 && seatnormals.length == 0) {
					//     gamelog.showlog("&leave bots>>", seatBots.length);
					//     for (i = 0; i < seatBots.length; i++) {
					//         (function (x) {
					//             setTimeout(function () {
					//                 exports.Leave(null, {
					//                     room_id: roomlist[index].roomid,
					//                     player_id: seatBots[x].username,
					//                     position: seatBots[x].seatnumber,
					//                     action: 'leave'
					//                 });
					//             }, 80 * x);
					//         })(i);
					//     }
					// }
					// else if (seatBots.length > 0 && seatnormals.length == 0) {
					//     if (seatBots.length > 0) {
					//         gamelog.showlog("botleave?", seatBots.length);
					//         for (i = 0; i < seatBots.length; i++) {
					//             (function (x) {
					//                 setTimeout(function () {
					//                     exports.Leave(null, {
					//                         room_id: data.room_id,
					//                         player_id: seatBots[x].username,
					//                         position: seatBots[x].seatnumber,
					//                         action: 'leave'
					//                     });
					//                 }, 80 * x);
					//             })(i);
					//         }
					//     }
					// }
					// else if (roomlist[index].playerlist.length == 1) {
					//     if (roomlist[index].gamemode == 'tournament') {
					//         if (getOnlineRooms() > 1) {
					//             setTimeout(() => {
					//                 let count = 1;
					//                 let interval = setInterval(() => {
					//                     count++;
					//                     if (count < parseInt(roomlist[index].seatlimit)) {
					//                         roommanager.enterroom_bot(roomlist[index].roomid);
					//                     } else {
					//                         clearInterval(interval);
					//                     }
					//                 }, 200);
					//             }, 400);
					//         } else {
					//             in_points(roomlist[index].playerlist[0].username, 100000000000);
					//             io.sockets.emit("TOURNAMENT_WIN", {
					//                 winner: roomlist[index].playerlist[0].username
					//             });
					//         }
					//     }
					// }
					// if (getOnlineRooms() == 1) {
					//     io.sockets.emit("TOURNAMENT_FINAL_TABLE", {
					//         result: 'success'
					//     });
					// }
				}, waitingtime);
			}, 150);
		});
		roomlist[index].table.on("updatePlayer", function (player) {
			io.in("r" + roomlist[index].roomid).emit("UPDATE_PLAYER", {
				player: player,
			});
		});
		if (roomlist[index].gamemode == "tournament") levelTimer(index);

		roomlist[index].totalPot = 0;
		roomlist[index].table.startGame();
	} else {
		if (roomlist[index].gamemode == "tournament") {
			checkStartgame1(index);
		} else {
			roomlist[index].table.initNewRound();
			roomlist[index].status = 1;
		}
	}
}

function levelTimer(index) {
	if (roomlist[index].playerlist == 0) {
		clearInterval(roomlist[index].levelTimeout);
		roomlist[index].levelTimeout == null;
		return;
	}
	roomlist[index].levelTimeout = setInterval(function () {
		if (roomlist[index] != null) {
			if (roomlist[index].level < config.Tour_SB.array.length) {
				let sb = parseInt(config.Tour_SB.array[roomlist[index].level]);
				let bb = 2 * parseInt(config.Tour_SB.array[roomlist[index].level]);
				roomlist[index].table.smallBlind = sb;
				roomlist[index].table.bigBlind = bb;
				roomlist[index].smallBlind = sb;
				roomlist[index].bigBlind = bb;

				roomlist[index].isBreakTime = false;
				roomlist[index].level++;
			}
		}
	}, parseInt(config.Level_Time.time));
}

function getOnlineRooms() {
	let count = 0;
	for (let index = 0; index < roomlist.length; index++) {
		const room = roomlist[index];
		if (room.removed == false && room.gamemode == "tournament") {
			count++;
		}
	}
	return count;
}
async function checkStartgame(index) {
	let checked = await checkrooms_tournament(index);
	if (checked == false) {
		if (roomlist[index].isBreakTime == false) {
			roomlist[index].table.initNewRound();
		} else {
			let emitdata = {
				break: true,
			};
			io.sockets.in("r" + roomlist[index].roomid).emit("Break_Game", emitdata);
			let checkNewRound = setInterval(() => {
				if (roomlist[index].isBreakTime == false) {
					let emitdata = {
						break: false,
					};
					io.sockets
						.in("r" + roomlist[index].roomid)
						.emit("Break_Game", emitdata);
					roomlist[index].table.initNewRound();
					clearInterval(checkNewRound);
				}
			}, 100);
		}
		let sitteds = exports.getPlayersSitted(roomlist[index]);
		if (sitteds < 2) {
			clearInterval(roomlist[index].levelTimeout);
		}
	}
}
async function checkStartgame1(index) {
	let checked = await checkrooms_tournament(index);
	if (checked == false) {
		roomlist[index].table.initNewRound();
		roomlist[index].status = 1;
	}
}
async function checkrooms_tournament(roomIndex) {
	let room = roomlist[roomIndex];
	let checked = 0;
	let checking = false;
	for (let index = 0; index < roomlist.length; index++) {
		if (room != roomlist[index] && roomlist[index].gamemode == "tournament") {
			let check_room = roomlist[index];
			let emtpy_seats_num = check_room.seatlimit - check_room.playerlist.length;
			if (
				emtpy_seats_num >= room.playerlist.length &&
				check_room.playerlist.length >= room.playerlist.length
			) {
				if (check_room.table.started == true && check_room.removed == false) {
					let check_seats = [];
					for (let i = 0; i < check_room.playerlist.length; i++) {
						check_seats.push(check_room.playerlist[i].seatnumber);
					}
					for (let i = 0; i < room.playerlist.length; i++) {
						room.playerlist[i].moveroom = 0;
						room.playerlist[i].moveroom = check_room.roomid;
						checked++;
						checking = true;
					}
					break;
				}
			}
		}
	}
	if (checking == false) return false;
	if (roomlist.length == 1) return false;
	setTimeout(() => {
		if (checked == room.playerlist.length) {
			let positions = [];
			let newUsers = [];
			room.removed = true;
			let roomSockets = [];
			if (io.nsps["/"].adapter.rooms["r" + room.roomid] != undefined) {
				for (socketID in io.nsps["/"].adapter.rooms["r" + room.roomid]
					.sockets) {
					let nickname = io.nsps["/"].connected[socketID].username;
					let clientSocket = io.sockets.connected[socketID];
					roomSockets.push({
						nickname: nickname,
						clientSocket: clientSocket,
					});
				}
			}
			for (let i = 0; i < room.playerlist.length; i++) {
				let moveroom_num = room.playerlist[i].moveroom;
				let to_room;
				for (let index = 0; index < roomlist.length; index++) {
					if (roomlist[index].roomid == moveroom_num) {
						to_room = roomlist[index];
					}
				}
				let filtered = roomSockets.filter(
					(x) => x.nickname == room.playerlist[i].username
				);
				if (filtered.length > 0) {
					let emitdata = {
						from: room.roomid,
						to: room.playerlist[i].moveroom,
						seat: room.playerlist[i].seatnumber,
					};

					filtered[0].clientSocket.emit("MOVE_TABLE", emitdata);
					filtered[0].clientSocket.leave("r" + room.roomid);
					filtered[0].clientSocket.join("r" + room.playerlist[i].moveroom);
					let socketData = {
						roomid: to_room.roomid,
						seatlimit: to_room.seatlimit,
						gamemode: to_room.gamemode,
						status: to_room.status,
						totalPot: to_room.totalPot,
						table: to_room.table,
						played: to_room.played,
						level: to_room.level,
						playerlist: to_room.playerlist,
					};
					let useridArray = [];
					to_room.playerlist.forEach((element) => {
						useridArray.push(element.username);
					});
					getUsername(useridArray, function (data) {
						let usernames = [];
						data.forEach((d) => {
							//gamelog.showlog(d.username);
							usernames.push({ userid: d.userid, username: d.username });
						});
						filtered[0].clientSocket.emit("CURRENT_ROOM_NAMES", {
							result: usernames,
						});
					});
					filtered[0].clientSocket.emit("CURRENT_ROOM_STATUS", socketData);
				}
				let gobody = room.playerlist[i];
				if (gobody.mode == "bot")
					BotManager.movebots(room.roomid, to_room.roomid);

				let gobody_player = room.table.getPlayerByName(gobody.username);
				if (gobody_player != undefined) {
					gobody.balance = gobody_player.chips;
				}
				let seat = gobody.seatnumber;
				gobody.getCorrectSeatnumber == 0;
				gobody.waitforbb = 2;

				gobody.leaveenterflag = 0;

				let pos = 0;
				while (true) {
					if (
						to_room.table.players[pos] == undefined ||
						to_room.table.players[pos].playerName == "Empty seat"
					) {
						let a = positions.filter((x) => x == pos);
						if (a.length == 0) {
							break;
						} else pos++;
					} else {
						pos++;
					}
				}

				positions.push(pos);
				gobody.seatnumber = pos;

				to_room.playerlist.push(gobody);
				newUsers.push(gobody);
				room.table.RemovePlayer(gobody.username);
				setTimeout(() => {
					let emitdata = {
						result: newUsers,
					};
					io.sockets
						.in("r" + to_room.roomid)
						.emit("TAKE_SEAT_PLAYERS", emitdata);
				}, 50);
			}
			setTimeout(() => {
				removetable(roomIndex);
			}, 10000);
			return true;
		} else return false;
	}, 100);
}

function removetable(roomIndex) {
	let seatedPlayers = roomlist[roomIndex].table.players.filter(
		(x) => x.playerName != "Empty seat"
	);
	if (seatedPlayers.length == 0) {
		roomlist[roomIndex].playerlist = [];
	}
}

function missedSeats(room) {
	let playersnum = exports.getPlayersSitted(room);
	if ((room.table.started = true)) {
		if (playersnum <= 2) {
			return true;
		}
	}
	return false;
}

function checkbets(bets) {
	let sum = 0;
	for (let index = 0; index < bets.length; index++) {
		const element = bets[index];
		sum += element;
	}
	return sum;
}

exports.roundMainPots = function (bets) {
	let mainPots = [];
	while (checkbets(bets) > 0) {
		let min = bets[0];
		for (let i = 0; i < bets.length; i++) {
			if (bets[i] > 0) min = min < bets[i] ? min : bets[i];
			if (min == 0) min = bets[i];
		}
		let mid = 0;
		let seats = [];
		for (let i = 0; i < bets.length; i++) {
			const element = bets[i];
			if (element >= min) {
				bets[i] -= min;
				mid += min;
				seats.push(i);
			}
		}
		let json = {
			pot: mid,
			seats: seats,
		};
		mainPots.push(json);
	}
	return mainPots;
};

exports.getMainPots = function (tPots, mainPots) {
	for (let i = 0; i < tPots.length; i++) {
		for (let j = 0; j < mainPots.length; j++) {
			let arr1 = tPots[i].seats;
			let arr2 = mainPots[j].seats;
			if (compareArray(arr1, arr2) == true) {
				tPots[i].pot += mainPots[j].pot;
			}
		}
	}

	for (let i = 0; i < mainPots.length; i++) {
		const element = mainPots[i];
		if (element.seats.length != 0) {
			tPots.push(element);
		}
	}
	return tPots;
};

function compareArray(arr1, arr2) {
	let rst = false;
	if (arr1.length != arr2.length) {
		return rst;
	}
	arr1.forEach(function (item) {
		let i = arr2.indexOf(item);
		if (i > -1) {
			arr2.splice(i, 1);
		}
	});
	rst = arr2.length == 0;
	return rst;
}
function checkIndex(player, position) {
	let index = player.getIndex();
	if (index == position) return true;
	else return false;
}
exports.Action = function (info) {
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == info.room_id) {
			let player = roomlist[index].table.getPlayerByName(info.player_id);
			let message = info.player_id;
			if (!player || player == undefined) return;
			if (
				player.table.currentPlayer != info.position &&
				checkIndex(player, info.position)
			)
				return;
			exports.removetimeout(index);
			player.updateTimebank(parseInt(info.timebank));
			switch (info.action) {
				case "call":
					if (info.bet == player.chips) {
						message += " called(allin) with $" + ChangeUnit(player.chips);
						player.allIn();
						info.action = "allin";
					} else {
						player.call();
						message += " called with $" + ChangeUnit(info.bet);
					}
					break;
				case "check":
					player.Check();
					message += " checked";
					break;
				case "raise":
					player.bet(parseInt(info.bet));
					roomlist[index].legalbet = parseInt(info.legal_bet);
					message += " raised with $" + ChangeUnit(parseInt(info.bet));
					break;
				case "allin":
					message += " bets(allin) with $" + ChangeUnit(player.chips);
					player.allIn();
					break;
				case "fold":
					player.fold();
					message += " folded";
					break;
			}

			let buff = roomlist[index].totalPot;
			buff += parseInt(info.bet);
			roomlist[index].totalPot = buff;
			let emitdata = {
				roomid: roomlist[index].roomid,
				name: info.player_id,
				position: info.position,
				action: info.action,
				bet: info.bet,
				chips: player.chips,
				currentBet: player.GetBet(),
				maxBet: player.table.getMaxBet(),
				roundBet: player.GetRoundBet(),
				roundPot: player.table.getRoundPot(),
				totalPot: roomlist[index].totalPot,
				isFolded: player.folded,
				isAllIn: player.isAllIn,
				isSeated: player.isSeated,
				isEmptySeat: player.isEmptySeat,
				message: message,
			};
			io.sockets.in("r" + info.room_id).emit("PLAYER_ACTION_RESULT", emitdata);
		}
	}
};
exports.Check = function (index, playerid) {
	if (roomlist[index].table != undefined) {
		let player = roomlist[index].table.getPlayerByName(playerid);
		if (!player || player == undefined) return;
		if (player.table.currentPlayer != player.getIndex()) return;
		exports.removetimeout(index);
		let message = playerid + " checked";
		if (player) {
			let emitdata = {
				roomid: roomlist[index].roomid,
				name: playerid,
				position: player.getIndex(),
				action: "check",
				bet: 0,
				chips: player.chips,
				currentBet: player.GetBet(),
				maxBet: player.table.getMaxBet(),
				roundBet: player.GetRoundBet(),
				roundPot: player.table.getRoundPot(),
				totalPot: roomlist[index].totalPot,
				isFolded: player.folded,
				isAllIn: player.isAllIn,
				isSeated: player.isSeated,
				isEmptySeat: player.isEmptySeat,
				message: message,
			};
			io.in("r" + roomlist[index].roomid).emit(
				"PLAYER_ACTION_RESULT",
				emitdata
			);
			player.Check();
		}
	}
};
exports.Call = function (index, playerid, bet) {
	if (roomlist[index].table != undefined) {
		for (let i = 0; i < roomlist[index].playerlist.length; i++) {
			let element = roomlist[index].playerlist[i];
			if (element.username == playerid) {
				element.foldedCount = 0;
			}
		}
		let player = roomlist[index].table.getPlayerByName(playerid);
		let message = playerid + " called with $" + ChangeUnit(bet);
		if (!player || player == undefined) return;
		if (player.table.currentPlayer != player.getIndex()) return;
		exports.removetimeout(index);
		if (player) {
			let action = "";
			if (bet == player.chips) {
				player.allIn();
				action = "allin";
			} else {
				player.call();
				action = "call";
			}
			let buff = roomlist[index].totalPot;
			buff += parseInt(bet);
			roomlist[index].totalPot = buff;
			let emitdata = {
				roomid: roomlist[index].roomid,
				name: playerid,
				position: player.getIndex(),
				action: action,
				bet: bet,
				chips: player.chips,
				currentBet: player.GetBet(),
				maxBet: player.table.getMaxBet(),
				roundBet: player.GetRoundBet(),
				roundPot: player.table.getRoundPot(),
				totalPot: roomlist[index].totalPot,
				isFolded: player.folded,
				isAllIn: player.isAllIn,
				isSeated: player.isSeated,
				isEmptySeat: player.isEmptySeat,
				message: message,
			};
			io.in("r" + roomlist[index].roomid).emit(
				"PLAYER_ACTION_RESULT",
				emitdata
			);
		}
	}
};

exports.Raise = function (index, playerid, bet, maxBet, currentBet, call) {
	if (roomlist[index].table != undefined) {
		for (let i = 0; i < roomlist[index].playerlist.length; i++) {
			let element = roomlist[index].playerlist[i];
			if (element.username == playerid) {
				element.foldedCount = 0;
			}
		}
		let legal_bet = roomlist[index].legalbet;
		let player = roomlist[index].table.getPlayerByName(playerid);
		let message = playerid;
		if (!player || player == undefined) return;
		if (player.table.currentPlayer != player.getIndex()) return;
		exports.removetimeout(index);
		if (player) {
			let action = "";
			if (bet < player.chips) {
				if (maxBet - currentBet == bet) {
					action = "call";
					message += " called with $" + ChangeUnit(bet);
				} else {
					action = "raise";
					message += " raised with $" + ChangeUnit(bet);
				}
				legal_bet = bet - call;
			} else {
				bet = player.chips;
				action = "allin";
				message += " raised(allin) with $" + ChangeUnit(bet);
			}
			player.bet(parseInt(bet));
			roomlist[index].legalbet = parseInt(legal_bet);

			let buff = roomlist[index].totalPot;
			buff += parseInt(bet);
			roomlist[index].totalPot = buff;
			let emitdata = {
				roomid: roomlist[index].roomid,
				name: playerid,
				position: player.getIndex(),
				action: action,
				bet: bet,
				chips: player.chips,
				currentBet: player.GetBet(),
				maxBet: player.table.getMaxBet(),
				roundBet: player.GetRoundBet(),
				roundPot: player.table.getRoundPot(),
				totalPot: roomlist[index].totalPot,
				isFolded: player.folded,
				isAllIn: player.isAllIn,
				isSeated: player.isSeated,
				isEmptySeat: player.isEmptySeat,
				message: message,
			};
			io.in("r" + roomlist[index].roomid).emit(
				"PLAYER_ACTION_RESULT",
				emitdata
			);
		}
	}
};
exports.fold = function (index, playerid) {
	if (roomlist[index].table != undefined) {
		if (roomlist[index].table != undefined) {
			let player = roomlist[index].table.getPlayerByName(playerid);
			let message = playerid + " folded";
			if (!player || player == undefined) return;
			if (player.table.currentPlayer != player.getIndex()) return;
			exports.removetimeout(index);
			if (player) {
				let emitdata = {
					roomid: roomlist[index].roomid,
					name: playerid,
					position: player.getIndex(),
					action: "fold",
					bet: 0,
					chips: player.chips,
					currentBet: player.GetBet(),
					maxBet: player.table.getMaxBet(),
					roundBet: player.GetRoundBet(),
					roundPot: player.table.getRoundPot(),
					totalPot: roomlist[index].totalPot,
					isFolded: player.folded,
					isAllIn: player.isAllIn,
					isSeated: player.isSeated,
					isEmptySeat: player.isEmptySeat,
					message: message,
				};
				io.sockets
					.in("r" + roomlist[index].roomid)
					.emit("PLAYER_ACTION_RESULT", emitdata);
				player.fold();
			}
		}
	}
};
exports.removetimeout = function (index) {
	if (roomlist[index] == null) return;
	roomlist[index].turn = false;
	if (roomlist[index].currenttimeout != undefined) {
		clearTimeout(roomlist[index].currenttimeout);
		roomlist[index].currenttimeout = null;
	}
};
// leave button
exports.PlayerViewMode = function (socket, data) {
	let roomid = data.room_id;
	let username = data.player_id;
	let position = data.position;
	//gamelog.showlog(data);
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == roomid) {
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				const element = roomlist[index].playerlist[i];
				if (element.username == username) {
					let alone = false;
					if (element.leaveenterflag == 0) {
						// sit-down state: sitting in a seat but not playing
						let player = roomlist[index].table.getPlayerByName(username);
						if (player != undefined) {
							//gamelog.showlog("8");
							in_points(username, player.chips);
							player.chips = 0;
						} else {
							in_points(username, element.balance);
							element.balance = 0;
						}
						if (element.getCorrectSeatnumber == 0) {
							let emitdata = {
								result: "failed",
							};
							if (socket != null)
								socket.emit("PLAYER_VIEW_TABLE_RESULT", emitdata);

							setTimeout(() => {
								let takeSeats = [];
								for (let i = 0; i < roomlist[index].playerlist.length; i++) {
									const element = roomlist[index].playerlist[i];

									if (
										element.getCorrectSeatnumber == 1 &&
										element.leaveenterflag == 0
									) {
										takeSeats.push(element);
									}
								}
								let emitdata = {
									result: takeSeats,
								};
								io.sockets.in("r" + roomid).emit("TAKE_SEAT_PLAYERS", emitdata);
							}, 100);
							return;
						} else {
							gamelog.showlog("????");
						}
					} // The status taken a part in game directly
					else {
						let sitteds = exports.getPlayersSitted(roomlist[index]);
						if (roomlist[index].table.started == true) {
							if (sitteds > 0) {
								if (roomlist[index].table.currentPlayer == position) {
									//gamelog.showlog("fold~");
									exports.fold(index, username);
								}
							}
						}
						element.leaveenterflag = 0; // Switch to waiting for take part in
						let player = roomlist[index].table.getPlayerByName(
							element.username
						);
						//gamelog.showlog("5");
						in_points(username, player.chips);
						element.balance = 0;
						player.chips = 0;

						let delay = 100;
						setTimeout(() => {
							roomlist[index].table.RemovePlayer(username);
							setTimeout(() => {
								let seatedPlayers = roomlist[index].table.players.filter(
									(x) => x.playerName != "Empty seat" && x.isEmptySeat == false
								);
								//if (seatedPlayers.length <= 1) {
								if (seatedPlayers.length == 0) {
									roomlist[index].table.initPlayers();
								} else {
									// let seatedPlayers1 = roomlist[index].playerlist.filter(x => x.leaveenterflag == 1);
									// let seatnormals = seatedPlayers1.filter(x => x.mode == 'normal');
									// let seatBots = roomlist[index].playerlist.filter(x => x.mode == 'bot');
									// if (socket != null) {
									//     if (seatBots.length == 0 && seatnormals.length == 1) {
									//         if(seatnormals[0].leaveenterflag == 1){
									//         gamelog.showlog('>>');
									//         roommanager.BotsCreating(roomlist[index].roomid, roomlist[index].buyin_min, roomlist[index].seatlimit);
									//         }
									//     }
									//     else if (seatBots.length > 0 && seatnormals.length == 0) {
									//         gamelog.showlog("&leave bots>>", seatBots.length);
									//         for (i = 0; i < seatBots.length; i++) {
									//             (function (x) {
									//                 setTimeout(function () {
									//                     exports.Leave(null, {
									//                         room_id: data.room_id,
									//                         player_id: seatBots[x].username,
									//                         position: seatBots[x].seatnumber,
									//                         action: 'leave'
									//                     });
									//                 }, 80 * x);
									//             })(i);
									//         }
									//     }
									// }
								}
								//}
							}, 100);
						}, delay);
					}
					element.getCorrectSeatnumber = 0; // Convert to unconfirmed seat number
					element.foldedCount = 0;
					if (roomlist[index].gamemode == "cash") {
						let collection = database.collection("User_Data");
						let query = {
							userid: element.username,
						};
						collection.updateOne(
							query,
							{
								$set: {
									connected_room: -1,
								},
							},
							function (err) {
								if (err) throw err;
							}
						);
					}
					setTimeout(() => {
						let onlineplayers = roomlist[index].playerlist.filter(
							(x) => x.leaveenterflag != 0
						);
						if (onlineplayers.length == 1) alone = true;
						let emitdata = {
							result: "success",
							roomid: roomid,
							userid: username,
							position: position,
							alone: alone,
						};

						io.sockets
							.in("r" + roomid)
							.emit("PLAYER_VIEW_TABLE_RESULT", emitdata);
						setTimeout(() => {
							let takeSeats = [];
							for (let i = 0; i < roomlist[index].playerlist.length; i++) {
								const element = roomlist[index].playerlist[i];

								if (
									element.getCorrectSeatnumber == 1 &&
									element.leaveenterflag == 0
								) {
									takeSeats.push(element);
								}
							}
							let emitdata = {
								result: takeSeats,
							};
							io.sockets.in("r" + roomid).emit("TAKE_SEAT_PLAYERS", emitdata);
						}, 200);
					}, 500);
					break;
				}
			}
		}
	}
};
exports.Buyin = function (info, socket) {
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == info.room_id) {
			let player = roomlist[index].table.getPlayerByName(info.username);
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				let element = roomlist[index].playerlist[i];
				if (element.username == info.username) {
					if (player == null) {
						setTimeout(() => {
							//gamelog.showlog("player null");
							if (roomlist[index].gamemode == "tournament")
								element.balance = parseInt(info.buyin_money);
							else element.balance += parseInt(info.buyin_money);
							//gamelog.showlog("out_points:", info.buyin_money);
							out_points(info.username, info.buyin_money);
							io.sockets.in("r" + info.room_id).emit("ADD_BALANCE", info);

							let seatedPlayers = roomlist[index].playerlist.filter(
								(x) => x.leaveenterflag == 1
							);
							let real_seatedPlayers = [];
							for (let j = 0; j < seatedPlayers.length; j++) {
								const e = seatedPlayers[j];
								let p = roomlist[index].table.getPlayerByName(e.username);
								if (p) {
									if (p.isEmptySeat == false) {
										real_seatedPlayers.push(p);
									}
								}
							}
							setTimeout(() => {
								let checknum = 0;
								if (roomlist[index].gamemode == "tournament") checknum = 3;
								else checknum = 1;
								if (
									seatedPlayers.length == 0 &&
									seatedPlayers.filter((x) => x.mode == "bot").length == 0
								) {
									//gamelog.showlog(">>>");
									roommanager.BotsCreating(
										roomlist[index].roomid,
										roomlist[index].buyin_min,
										roomlist[index].seatlimit
									);
								}
								if (
									seatedPlayers.length <= checknum ||
									real_seatedPlayers.length <= checknum
								) {
									exports.removetimeout(index);
									element.leaveenterflag = 1;
									let seatnumber = roomlist[index].table.addPlayer({
										playerName: element.username,
										chips: element.balance,
										avatar: element.avatar,
										photoUrl: element.photoUrl,
										photoType: element.photoType,
										position: element.seatnumber,
									});
									element.seatnumber = seatnumber;

									setTimeout(() => {
										getCurrentRoomStatus(index, socket);
										let checknum = 0;
										if (roomlist[index].gamemode == "tournament") checknum = 3;
										else checknum = 1;
										// if (seatedPlayers.filter(x => x.mode == 'bot').length == seatedPlayers.length) {
										//     //gamelog.showlog('there are only bots');
										//     if (seatedPlayers.length > 0) checknum = seatedPlayers.length;
										// }
										if (
											seatedPlayers.length == checknum ||
											real_seatedPlayers.length == checknum
										) {
											setTimeout(() => {
												if (roomlist[index].status == 0) {
													//gamelog.showlog("start round");
													roundstart(index);
													roomlist[index].status = 1;
												} else {
													if (roomlist[index].gamemode == "tournament")
														levelTimer(index);
													//gamelog.showlog("new round");
													roomlist[index].table.initNewRound();
												}
											}, 100);
										}
									}, 100);
								} else if (
									seatedPlayers.length > checknum ||
									real_seatedPlayers.length > checknum
								) {
									//gamelog.showlog("wait for bb");
									io.sockets
										.in("r" + info.room_id)
										.emit("BUYIN_WAITFORBB", info);
									// let seatBots = roomlist[index].playerlist.filter(x => x.mode == 'bot');
									// gamelog.showlog("seatBots.length???? ", seatBots.length);
									// setTimeout(() => {
									//     if (seatBots.length > 0) {
									//         gamelog.showlog("seatBots--", seatBots.length);
									//         for (i = 0; i < seatBots.length; i++) {
									//             (function (x) {
									//                 setTimeout(function () {
									//                     exports.Leave(null, {
									//                         room_id: info.room_id,
									//                         player_id: seatBots[x].username,
									//                         position: seatBots[x].seatnumber,
									//                         action: 'leave'
									//                     });
									//                 }, 80 * x);
									//             })(i);
									//         }
									//     }
									// }, 100);
								}
								if (roomlist[index].gamemode == "cash") {
									let connected_room_number = roomlist[index].roomid;
									let collection = database.collection("User_Data");
									let query = {
										userid: element.username,
									};
									collection.updateOne(
										query,
										{
											$set: {
												connected_room: connected_room_number,
											},
										},
										function (err) {
											if (err) throw err;
										}
									);
								}
							}, 200);
						}, 300);
					} else {
						if (player.isEmptySeat == false) {
							element.balance += parseInt(info.buyin_money);
							player.chips += parseInt(info.buyin_money);
							//gamelog.showlog("2");
							out_points(info.username, info.buyin_money);
							io.sockets.in("r" + info.room_id).emit("BUYIN_BALANCE", info);
						} else {
							element.balance += parseInt(info.buyin_money);
							player.chips += parseInt(info.buyin_money);
							//gamelog.showlog("3");
							out_points(info.username, info.buyin_money);
							let seatedPlayers = roomlist[index].table.players.filter(
								(x) => !x.isEmptySeat
							);
							if (seatedPlayers.length == 1) {
								exports.removetimeout(index);
								element.buyinflag = 1;
								io.sockets.in("r" + info.room_id).emit("BUYIN_BALANCE", info);
								player.isEmptySeat = false;
								player.isSeated = true;
								roomlist[index].table.checkRestart(player);
							} else if (seatedPlayers.length > 1) {
								io.sockets.in("r" + info.room_id).emit("BUYIN_BALANCE", info);
								element.buyinflag = 0;
								//gamelog.showlog("buyinFlog = 0");
							}
						}
					}
				}
			}
		}
	}
};

function Record_Won_History(
	winner,
	prize,
	wining_hand,
	wining_cards,
	handrankVal
) {
	let collection = database.collection("User_Data");
	let query = {
		userid: winner,
	};
	let best_winning_hand = {
		cards: wining_cards,
		hand: wining_hand,
		handval: handrankVal,
	};
	collection.findOne(query, function (err, result) {
		if (err) { } //gamelog.showlog("error2", err);
		else {
			if (result != null) {
				let hands_won = result.hands_won;
				hands_won += 1;
				let percent_won = percentIncrease(hands_won, result.hands_played);
				collection.updateOne(
					query,
					{
						$set: {
							hands_won: hands_won,
							win_percent_holdem: percent_won,
						},
					},
					function (err) {
						if (err) throw err;
					}
				);
				if (result.biggest_pot_won < prize) {
					collection.updateOne(
						query,
						{
							$set: {
								biggest_pot_won: prize,
							},
						},
						function (err) {
							if (err) throw err;
						}
					);
				}
				if (result.best_winning_hand.handval < handrankVal) {
					collection.updateOne(
						query,
						{
							$set: {
								best_winning_hand: best_winning_hand,
							},
						},
						function (err) {
							if (err) throw err;
						}
					);
				}
			}
		}
	});
}
exports.ShowCards = function (info) {
	io.sockets.in("r" + info.room_id).emit("SHOW_CARDS_RESULT", info);
};

exports.PlayerLeave = function (socket, data) {
	//gamelog.showlog("click player leave ~");
	let index = 0;
	for (let i = 0; i < roomlist.length; i++) {
		if (roomlist[i].roomid == data.room_id) {
			index = i;
			break;
		}
	}
	setTimeout(() => {
		if (roomlist[index]) {
			if (roomlist[index].gamemode == "cash") {
				let seatedPlayers1 = roomlist[index].playerlist.filter(
					(x) => x.leaveenterflag == 1
				);
				let seatnormals = seatedPlayers1.filter((x) => x.mode == "normal");
				let seatBots = roomlist[index].playerlist.filter(
					(x) => x.mode == "bot"
				);
				if (socket != null) {
					if (seatBots.length == 0 && seatnormals.length == 1) {
						//gamelog.showlog(">>>>");
						roommanager.BotsCreating(
							roomlist[index].roomid,
							roomlist[index].buyin_min,
							roomlist[index].seatlimit
						);
					} else if (seatBots.length > 0 && seatnormals.length == 0) {
						if (seatBots.length > 0) {
							//gamelog.showlog("botleave?", seatBots.length);
							for (i = 0; i < seatBots.length; i++) {
								(function (x) {
									setTimeout(function () {
										exports.Leave(null, {
											room_id: data.room_id,
											player_id: seatBots[x].username,
											position: seatBots[x].seatnumber,
											action: "leave",
										});
									}, 80 * x);
								})(i);
							}
						}
					}
				}
			}
		}
	}, 2000);
};
exports.Leave = function (socket, data) {
	let index;
	let username = data.player_id;
	let position = data.position;

	for (let i = 0; i < roomlist.length; i++) {
		if (roomlist[i].roomid == data.room_id) {
			index = i;
			break;
		}
	}

	//gamelog.showlog(data.room_id);
	// gamelog.showlog(
	// 	"LEAVE roomindex",
	// 	index,
	// 	"username",
	// 	username,
	// 	"position",
	// 	position
	// );
	let leftPoints = 0;
	let isExist = false;
	let leavePos = 0;
	setTimeout(() => {
		if (roomlist[index]) {
			for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				if (roomlist[index].playerlist[i].username == username) {
					leftPoints = leftPoints = roomlist[index].playerlist[i].balance;
					if (roomlist[index].playerlist[i].mode == "bot")
						BotManager.leaveBot(username);
					//gamelog.showlog('splice > player');
					//roomlist[index].playerlist.splice(i, 1);
					leavePos = i;
					isExist = true;
					//i--;
					break;
				}
			}
		}
		setTimeout(() => {
			if (isExist == true) {
				let sitteds = exports.getPlayersSitted(roomlist[index]);
				if (roomlist[index].table.started == true) {
					if (sitteds > 0) {
						if (roomlist[index].table.currentPlayer == position) {
							//gamelog.showlog("fold~");
							exports.fold(index, username);
						}
					}
				}
				if (roomlist[index].gamemode == "cash") {
					let collection = database.collection("User_Data");
					let query = {
						userid: username,
					};
					collection.updateOne(
						query,
						{
							$set: {
								connected_room: -1,
							},
						},
						function (err) {
							if (err) throw err;
						}
					);
				}
				setTimeout(() => {
					let emitdata = {
						name: username,
						position: position,
						action: "leave",
					};
					let pl = roomlist[index].table.getPlayerByName(username);
					//gamelog.showlog("6");
					if (pl) {
						in_points(username, pl.chips);
						roomlist[index].table.RemovePlayer(username);
						//gamelog.showlog("remote table player ", username);
					} else {
						in_points(username, leftPoints);
					}
					//gamelog.showlog("Player___Leave >> ", username);
					for (let index = 0; index < roomlist.length; index++) {
						if (roomlist[index].roomid == data.room_id) {
							for (let i = 0; i < roomlist[index].playerlist.length; i++) {
								const element = roomlist[index].playerlist[i];
								//gamelog.showlog(" element username: ", element.username);
							}
						}
					}
					//gamelog.showlog("splice > player:", roomlist[index].playerlist.length);
					roomlist[index].playerlist.splice(leavePos, 1);
					//gamelog.showlog("so =>", roomlist[index].playerlist.length);
					io.sockets
						.in("r" + data.room_id)
						.emit("PLAYER_LEAVE_RESULT", emitdata);
					if (socket != null) socket.leave("r" + data.room_id);
					if (sitteds == 0) {
						exports.removetimeout(index);
						let query = {
							roomid: parseInt(data.room_id),
						};
						let collection = database.collection("Room_Data");
						collection.deleteOne(query, function (err, removed) {
							if (err) {
								//gamelog.showlog("error3", err);
							}
						});
					}
				}, 100);
			}
		}, 300);
	}, 100);
};

function LeaveUser(index, player, mode) {
	let username = player.playerName;
	let position = player.getIndex();
	let room_id = roomlist[index].roomid;
	if (mode == "bot") {
		BotManager.leaveBot(username);
	}
	let emitdata = {
		name: username,
		position: position,
	};
	io.sockets.in("r" + room_id).emit("Exit_User", emitdata);

	/*
		  let isExist = false;
		  if (roomlist[index]) {
			  for (let i = 0; i < roomlist[index].playerlist.length; i++) {
				  if (roomlist[index].playerlist[i].username == username) {
					  isExist = true;
					  roomlist[index].playerlist.splice(i, 1);
					  i--;
				  }
			  }
		  }
		  setTimeout(() => {
			  if (isExist == true) {            
				  if (mode == 'bot') {
					  BotManager.leaveBot(username);
				  }
	  
				  setTimeout(() => {
					  
					  if (roomlist[index].gamemode == 'tournament') {
						  let sitteds = exports.getPlayersSitted(roomlist[index]);
						  if (sitteds == 0) {
							  exports.removetimeout(index);
							  roomlist.splice(index, 1);
							  let query = {
								  roomid: parseInt(room_id)
							  };
							  let collection = database.collection('Room_Data');
							  collection.deleteOne(query, function (err, removed) {
								  if (err) {
									  gamelog.showlog("error4",err);
								  } else {
									  gamelog.showlog('room', room_id, 'has removed successfully!');
								  }
							  });
						  }
					  }
				  }, 50);
			  }
		  }, 100);
		  */
}

exports.SendGift = function (data) {
	io.sockets.in("r" + data.room_id).emit("RES_GIFT", data);
	let room_id = data.room_id;
	let sender = parseInt(data.sender);
	let receiver = parseInt(data.receiver);
	let gift_index = data.gift_index;
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == room_id) {
			if (receiver == roomlist[index].seatlimit) {
				// send to all
				for (let i = 0; i < roomlist[index].table.players.length; i++) {
					const element = roomlist[index].table.players[i];
					if (sender != i) element.gift = gift_index;
				}
			} else {
				// send to receiver
				if (roomlist[index].table.players[receiver].gift != undefined) {
					roomlist[index].table.players[receiver].gift = gift_index;
				}
			}
		}
	}
};
// send a room-chat-message
exports.ChatMessage = function (socket, data) {
	//socket.in('r' + data.roomid).emit('REQ_CHAT_RESULT', mydata);
	io.sockets.in("r" + data.roomid).emit("RES_CHAT", data);
};
exports.PublicChatMessage = function (socket, data) {
	io.sockets.emit("RES_PUBLIC_CHAT", data);
	let collection = database.collection("Public_Chat_Data");
	collection.insertOne(data, function (err) {
		if (err) {
			//gamelog.showlog("error30", err);
			throw err;
		}
	});
};
exports.GetPublicChats = function (socket, data) {
	let collection1 = database.collection("Public_Chat_Data");
	let chats = [];
	collection1.find().toArray(function (err, docs) {
		if (!err) {
			if (docs.length > 0) {
				let counter = 0;
				for (let i = docs.length - 1; i >= 0; i--) {
					//counter++;
					const element = docs[i];
					chats.push(element);
					//if (counter == 100) break;
				}
			}
			let emitdata = {
				result: "success",
				chat_data: chats,
			};
			socket.emit("RES_PUBLIC_CHAT_RESULT", emitdata);
		}
	});
};
exports.CheckSpin = function (socket, data) {
	let collection = database.collection("User_Data");
	let query = {
		userid: data.userid,
	};
	collection.findOne(query, function (err, result) {
		if (err) { } //gamelog.showlog("error5", err);
		else {
			try {
				if (result.spin_date.getTime() == result.created_date.getTime()) {
					let message = {
						result: "success",
					};
					socket.emit("REQ_SPIN_RESULT", message);
				} else {
					let now = new Date();
					let diffTime = now.getTime() - result.spin_date.getTime(); // milliseconds

					if (diffTime >= 1800000) {
						let message = {
							result: "success",
						};
						socket.emit("REQ_SPIN_RESULT", message);
					} else {
						let allowTime = result.spin_date.getTime() + 1800000;
						let gap = allowTime - now.getTime();
						socket.emit("REQ_SPIN_RESULT", msToTime(gap));
					}
				}
			} catch (e) {
				//gamelog.showlog(e);
			}
		}
	});
};
exports.SuccessSpin = function (socket, data) {
	let spinBalances = [
		100000000, 200000000, 300000000, 400000000, 500000000, 600000000, 700000000,
		800000000,
	];
	let value = parseInt(data.value);
	let buff = spinBalances.filter((x) => x == value);
	if (buff.length > 0) {
		//gamelog.showlog(buff[0]);
		let collection = database.collection("User_Data");
		let query = {
			userid: data.userid,
		};
		collection.findOne(query, function (err, result) {
			if (err) { } //gamelog.showlog("error6", err);
			else {
				let points = result.points + value;
				collection.updateOne(
					query,
					{
						$set: {
							points: points,
							spin_date: new Date(),
						},
					},
					function (err) {
						if (err) throw err;
					}
				);
			}
		});
	}
};

function msToTime(duration) {
	let milliseconds = parseInt((duration % 1000) / 100),
		seconds = Math.floor((duration / 1000) % 60),
		minutes = Math.floor((duration / (1000 * 60)) % 60),
		hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	_hours = hours < 10 ? "0" + hours : hours;
	_minutes = minutes < 10 ? "0" + minutes : minutes;
	_seconds = seconds < 10 ? "0" + seconds : seconds;
	let datajson = {
		result: "remaining",
		hours: hours,
		minutes: minutes,
		seconds: seconds,
	};
	return datajson;
}

function getFormattedDate() {
	var date = new Date();
	date.setHours(9, 0, 0); // Set hours, minutes and seconds
	return date.toString();
}

function setTournaments() {
	// let time = date.setHours(20, 0, 0) - new Date().getTime();
	// gamelog.showlog(msToTime(time));
	let isAdd = false;
	let collection = database.collection("Tournament");
	let maxTime = 0;
	collection.find().toArray(function (err, docs) {
		if (err) {
			throw err;
		} else {
			if (docs.length > 0) {
				let times = [];
				for (let i = 0; i < docs.length; i++) {
					const element = docs[i];
					times.push(element.start_time.getTime());
				}
				maxTime = Math.max.apply(null, times);
				isAdd = false;
			} else {
				isAdd = true;
				let date = new Date();
				let d1 = new Date(
					date.getFullYear(),
					date.getDay() + 1,
					date.getDate(),
					date.getHours(),
					0,
					0
				);
				maxTime = d1.getTime();
			}
		}
	});
	setTimeout(() => {
		if (isAdd == true) {
			let startTime = maxTime;
			for (let index = 0; index < 4; index++) {
				startTime = startTime + 14400000; // (4 hours)
				let date = new Date(startTime);

				let query = {
					index: index,
					start_time: date,
					participant: 0,
					players: [],
					fee: 1000000000,
					win: [100000000000, 30000000000, 20000000000, 10000000000],
				};
				addTournament(index, date);
				collection.insertOne(query, function (err) {
					if (err) {
						//gamelog.showlog("error7", err);
						throw err;
					}
				});
			}
		} else {
			collection.find().toArray(function (err, docs) {
				if (err) {
					throw err;
				} else {
					if (docs.length > 0) {
						let startTime = maxTime;
						for (let i = 0; i < docs.length; i++) {
							const element = docs[i];
							if (element.start_time.getTime() <= new Date().getTime()) {
								let qur = {
									index: element.index,
								};
								for (let j = 0; j < tourlist.length; j++) {
									if (tourlist[j].index == element.index) {
										tourlist.splice(j, 1);
										j--;
									}
								}
								collection.deleteOne(qur, function (err, removed) {
									if (err) {
										//gamelog.showlog("error8", err);
									} else {
										startTime = startTime + 14400000; // (2 hours)
										let date1 = new Date(startTime);
										let query1 = {
											index: element.index,
											start_time: date1,
											participant: 0,
											players: [],
											fee: 1000000000,
											win: [
												100000000000, 30000000000, 20000000000, 10000000000,
											],
										};
										addTournament(element.index, date1);
										collection.insertOne(query1, function (err) {
											if (err) {
												//gamelog.showlog("error9", err);
												throw err;
											}
										});
									}
								});
							}
						}
					}
				}
			});
		}
	}, 1500);
}

function addTournament(index, date) {
	let collection = database.collection("Tournament");
	let tour = {
		index: index,
		checkTimeout: null,
		participant: 0,
		start_time: date,
		remain_time: msToTime(date.getTime() - new Date().getTime()),
		players: [],
		fee: 1000000000,
		win: [100000000000, 30000000000, 20000000000, 10000000000],
	};
	tourlist.push(tour);
	let j = null;
	for (let i = 0; i < tourlist.length; i++) {
		if (tourlist[i].index == index) {
			j = i;
			break;
		}
	}
	setTimeout(() => {
		let count = 0;
		tourlist[j].checkTimeout = setInterval(() => {
			let remaintime = msToTime(date.getTime() - new Date().getTime());
			if (remaintime.hours == 0 && remaintime.minutes == 3) {
				roommanager.RandomBots();
				clearInterval(tourlist[j].checkTimeout);
			}
			count++;
			if (count <= 30) {
				tourlist[j].participant = count;

				let query = {
					index: tourlist[j].index,
				};
				collection.findOne(query, function (err, result) {
					if (err){ } //gamelog.showlog("error35", err);
					else {
						if (result != null) {
							let players = result.players;
							players.push("0");

							collection.updateOne(
								query,
								{
									$set: {
										players: players,
										participant: players.length,
									},
								},
								function (err) {
									if (err) throw err;
									else {
										if (io !== undefined) {
											io.sockets.emit("REQ_TOUR_REGISTER_RESULT", {
												result: "success",
												userid: "0",
												index: tourlist[j].index,
												participant: players.length,
											});
										}
									}
								}
							);
						}
					}
				});
			}
		}, 2000);
	}, 60000);
}
exports.getTournaments = function (socket, data) {
	setTournaments();
	let collection = database.collection("Tournament");
	let results = [];
	setTimeout(() => {
		collection.find().toArray(function (err, docs) {
			if (err) {
				throw err;
			} else {
				if (docs.length > 0) {
					for (let i = 0; i < docs.length; i++) {
						const element = docs[i];
						let a = element.players.filter((x) => x == data.username);
						let isRegisted = false;
						if (a.length > 0) isRegisted = true;
						// if(element.start_time.getTime() <= new Date().getTime())
						//      continue;
						let item = {
							index: element.index,
							start_time: {
								hours: element.start_time.getHours(),
								mins: 0,
								secs: 0,
							},
							remain_time: msToTime(
								element.start_time.getTime() - new Date().getTime()
							),
							participant: element.participant,
							fee: element.fee,
							win: element.win,
							isRegistered: isRegisted,
						};
						results.push(item);
					}
				}
			}
		});
	}, 100);
	setTimeout(() => {
		socket.emit("REQ_TOUR_LIST_RESULT", {
			result: results,
		});
	}, 200);
};
exports.regTournaments = function (socket, data) {
	let collection = database.collection("Tournament");
	let query = {
		index: parseInt(data.tourIndex),
	};
	collection.findOne(query, function (err, result) {
		if (err) { } //gamelog.showlog("error10", err);
		else {
			if (result != null) {
				let players = result.players;
				players.push(data.userid);

				collection.updateOne(
					query,
					{
						$set: {
							players: players,
							participant: players.length,
						},
					},
					function (err) {
						if (err) throw err;
						else
							socket.emit("REQ_TOUR_REGISTER_RESULT", {
								result: "success",
								userid: data.userid,
								index: data.tourIndex,
								participant: players.length,
								fee: result.fee,
							});
						out_points(data.userid, result.fee);
					}
				);
			}
		}
	});
};
exports.OnDisconnect = function (socket) {
	console.log("-Disconnect", socket.room, socket.username, socket.id);
	let username = socket.username;
	let collection = database.collection("User_Data");
	let query;
	if (username == undefined)
		query = {
			connect: socket.id,
		};
	else
		query = {
			userid: username,
		};
	collection.updateOne(
		query,
		{
			$set: {
				connect: "",
			},
		},
		function (err) {
			if (err) throw err;
		}
	);
	if (socket.room == undefined || username == undefined) return;
	let roomid_arr = socket.room.split("");
	roomid_arr.splice(0, 1);
	let roomid = "";
	for (let i = 0; i < roomid_arr.length; i++) {
		roomid += roomid_arr[i];
	}
	let index;
	for (let i = 0; i < roomlist.length; i++) {
		if (roomlist[i].roomid == roomid) {
			index = i;
			break;
		}
	}

	let isExist = false;
	if (roomlist[index]) {
		for (let i = 0; i < roomlist[index].playerlist.length; i++) {
			if (roomlist[index].playerlist[i].username == username) {
				isExist = true;
				roomlist[index].playerlist.splice(i, 1);
				i--;
			}
		}
	}
	setTimeout(() => {
		if (isExist == true) {
			let player = roomlist[index].table.getPlayerByName(username);
			if (player == null) return;
			let position = player.getIndex();

			if (roomlist[index].table.started == true) {
				if (roomlist[index].table.currentPlayer == position) {
					exports.fold(index, username);
				}
			}
			setTimeout(() => {
				let emitdata = {
					name: username,
					position: position,
					action: "leave",
				};
				//("7");
				in_points(username, player.chips);
				roomlist[index].table.RemovePlayer(username);

				io.sockets.in("r" + roomid).emit("PLAYER_LEAVE_RESULT", emitdata);
				if (roomlist[index].gamemode == "tournament") {
					let sitteds = exports.getPlayersSitted(roomlist[index]);
					if (sitteds == 0) {
						exports.removetimeout(index);
						io.sockets.in("r" + roomid).emit("REMOVE_TABLE");
						//gamelog.showlog('@ remove room');
						roomlist.splice(index, 1);
						let query = {
							roomid: parseInt(roomid),
						};
						let collection = database.collection("Room_Data");
						collection.deleteOne(query, function (err, removed) {
							if (err) {
								//gamelog.showlog("error11", err);
							} else {
								//gamelog.showlog(roomid, "room has removed successfully!");
							}
						});
					}
				}
				setTimeout(() => {
					let seatedPlayers1 = roomlist[index].playerlist.filter(
						(x) => x.leaveenterflag == 1
					);
					let seatnormals = seatedPlayers1.filter((x) => x.mode == "normal");
					let seatBots = roomlist[index].playerlist.filter(
						(x) => x.mode == "bot"
					);
					if (socket != null) {
						if (seatBots.length == 0 && seatnormals.length == 1) {
							roommanager.BotsCreating(
								roomlist[index].roomid,
								roomlist[index].buyin_min,
								roomlist[index].seatlimit
							);
						} else if (seatBots.length > 0 && seatnormals.length == 0) {
							//gamelog.showlog("leave bots>>", seatBots.length);
							for (i = 0; i < seatBots.length; i++) {
								(function (x) {
									setTimeout(function () {
										exports.Leave(null, {
											room_id: roomid,
											player_id: seatBots[x].username,
											position: seatBots[x].seatnumber,
											action: "leave",
										});
									}, 80 * x);
								})(i);
							}
						}
					}
				}, 100);
			}, 300);
		}

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
	}, 200);
};
function GetRealName(userid) {
	var collection = database.collection("User_Data");
	var query = {
		userid: userid,
	};
	collection.findOne(query, function (err, result) {
		if (err){} //  gamelog.showlog("error13", err);
		else {
			if (result != null) {
				let hisName = result.username;
				//gamelog.showlog(hisName);
				return hisName;
			}
		}
	});
}
function getUsername(array_ids, callback) {
	var collection = database.collection("User_Data");
	// var query = {
	//     userid: userid
	// };
	// collection.findMany(query, function (err, result) {
	//     if (err)
	//         gamelog.showlog("error13", err);
	//     else {
	//         if (result != null) {
	//             callback(result.username);
	//         }
	//     }
	// });
	collection.find({ userid: { $in: array_ids } }).toArray(function (err, data) {
		if (err) {
			logger.winston.error(err);
		} else {
			//gamelog.showlog("data", data);
			callback(data);
		}
	});
}
function Update_level_handplayed(username) {
	var collection = database.collection("User_Data");
	var query = {
		userid: username,
	};
	collection.findOne(query, function (err, result) {
		if (err) { } //gamelog.showlog("error12", err);
		else {
			if (result != null) {
				let hands_played = result.hands_played;
				hands_played += 1;
				let divided = 0;
				let level = 0;
				if (result.level < 11) {
					divided = parseInt(hands_played / 50);
					level = divided + 1;
				} else {
					level = 11 + parseInt((hands_played - 500) / 100);
				}
				let percent_won = percentIncrease(result.hands_won, hands_played);
				collection.updateOne(
					query,
					{
						$set: {
							hands_played: hands_played,
							level: level,
							win_percent_holdem: percent_won,
						},
					},
					function (err) {
						if (err) throw err;
					}
				);
			}
		}
	});
}

function ChangeUnit(count) {
	let tokens = " KMBTqQsSondUDT";
	for (let i = 1; true; i += 1) {
		let val = Math.pow(1000, i);
		if (val > count) {
			return (count / Math.pow(1000, i - 1) + tokens[i - 1]).trim();
		}
	}
}

function getIndex(roomid) {
	for (let index = 0; index < roomlist.length; index++) {
		if (roomlist[index].roomid == roomid) {
			return index;
		}
	}
}

function in_points(username, in_points) {
	var collection = database.collection("User_Data");
	var query = { userid: username };
	collection.findOne(query, function (err, result) {
		if (err) throw ("in_points:", err);
		else if (result) {
			let mypoints = result.points;
			mypoints = mypoints.toString().replace(/\,/g, "");
			in_points = in_points.toString().replace(/\,/g, "");
			mypoints = parseInt(mypoints) + parseInt(in_points); //gamelog.showlog("+", in_points);
			if (parseInt(mypoints) < 0) mypoints = 0;
			collection.updateOne(
				query,
				{ $set: { points: parseInt(mypoints) } },
				function (err) {
					if (err) throw err;
				}
			);
		}
	});
}
function out_points(username, out_points) {
	var collection = database.collection("User_Data");
	var query = { userid: username };
	collection.findOne(query, function (err, result) {
		if (err) throw ("out_points:", err);
		else if (result) {
			let mypoints = result.points;
			mypoints = mypoints.toString().replace(/\,/g, "");
			out_points = out_points.toString().replace(/\,/g, "");
			mypoints = parseInt(mypoints) - parseInt(out_points); //gamelog.showlog("-", out_points);
			if (parseInt(mypoints) < 0) mypoints = 0;
			collection.updateOne(
				query,
				{ $set: { points: parseInt(mypoints) } },
				function (err) {
					if (err) throw err;
				}
			);
		}
	});
}

module.exports.tables = roomlist;
