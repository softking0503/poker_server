var colors = require("colors");
colors.setTheme({
    info: "bgGreen",
    help: "cyan",
    warn: "yellow",
    success: "bgBlue",
    error: "red",
});
var gamemanager = require("../game_manager/gamemanager");
var TableManager = require("../game_manager/tablemanager").TableManager;
var gamelog = require('../game_manager/gamelog');
const { collect } = require("underscore");
const Collection = require("mongodb/lib/collection");
var database = null;
var io;
var usedBotNames = [];
var bigBlinds = [
    10000000, 100000000, 1000000000, 5000000000, 10000000000, 20000000000,
    50000000000,
];

var tables = [];

exports.initdatabase = function (db) {
    try {
        database = db;
        let collection = database.collection("Tournament");
        collection.deleteMany(function (err, removed) {
            if (err) {
                //gamelog.showlog("error21", err);
            } else {
               // gamelog.showlog("all rooms has removed successfully!");
            }
        });
        getPhotos();
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.getRooms = function (socket, data) {
    try {
        let asdf = "";
        for (let i = 0; i < tables.length; i++) {
            asdf += tables[i].id + ",";
        }
        socket.emit('GET_ROOMS', asdf);
    } catch (e) {

    }
}

exports.setsocketio = function (socketio) {
    io = socketio;
};

exports.get_Entrance_Amount = function (socket) {
    try {
        getconfig();
        let mydata = {
            stakes_sb: config.STAKES_SB.array,
            min_max_buyins: config.MIN_MAX_BUYIN.array,
        };
        socket.emit("REQ_ENTRANCE_AMOUNT_RESULT", mydata);
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.removeTable = function (table) {
    //gamelog.showlog("Remove Table ID:", table.id);
    let tableCollection = database.collection("Table_Data");
    tableCollection.insertOne({
        type: "Remove",
        id: table.id
    })
    removeItem(tables, table);
    //gamelog.showlog("*** tables.length ", tables.length);
};

let removeItem = function (arr, value) {
    try {
        var index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.JoinRoom = function (data, socket) {
    try {
        let logData = [];
        logData['data'] = data;
        let tableData = [];
        for (let i = 0; i < tables.length; i++) {
            tableData.push({ "playerLength": tables[i].table.getIngamePlayersLength(), "maxPlayer": tables[i].table.maxPlayers, "gameMode": tables[i].gameMode, "minByin": tables[i].minBuyin, "tableId": tables[i].id });
        }
        logData["tableData"] = tableData;
        // gamelog.showlog(logData, 1);
    } catch (e) {
        // gamelog.showlog(e, 1);
    }
    try {
        if (data.roomid == null || data.roomid == "" || data.newtable == "True") {
            if (data.newtable == "True") {
                // try {
                //     gamelog.showlog("JoinRoom");
                //     gamelog.showlog(data.seatlimit + ":" + data.mode + ":" + data.min_buyin + ":" + data.roomid);
                //     for (let i = 0; i < tables.length; i++) {
                //         gamelog.showlog("RoomID:", tables[i].id);
                //         gamelog.showlog(tables[i].table.getIngamePlayersLength() + ":" + tables[i].table.maxPlayers + ":" + tables[i].gameMode + ":" + tables[i].minBuyin + ":" + tables[i].id)
                //     }
                // } catch (error) {
                //     gamelog.showlog(error);
                // }

                let table = tables.find(
                    (t) =>
                        t.table.getIngamePlayersLength() < t.table.maxPlayers &&
                        t.table.maxPlayers === fixNumber(data.seatlimit) &&
                        t.gameMode === data.mode &&
                        t.minBuyin === fixNumber(data.min_buyin) &&
                        t.id !== data.roomid
                );
                if (table) {
                    table.enterTable(socket, data.username, data.userid);
                } else {
                    createTable(
                        data.username,
                        data.userid,
                        data.seatlimit,
                        data.bigblind,
                        data.min_buyin,
                        data.max_buyin,
                        data.mode,
                        socket
                    );
                }
            } else {
                let table = tables.find(
                    (t) =>
                        t.table.getIngamePlayersLength() < t.table.maxPlayers &&
                        t.table.maxPlayers === fixNumber(data.seatlimit) &&
                        t.gameMode === data.mode &&
                        t.minBuyin === fixNumber(data.min_buyin)
                );
                if (table) {
                    table.enterTable(socket, data.username, data.userid);
                } else {
                    createTable(
                        data.username,
                        data.userid,
                        data.seatlimit,
                        data.bigblind,
                        data.min_buyin,
                        data.max_buyin,
                        data.mode,
                        socket
                    );
                }
            }
        } else {
            let table = tables.find((t) => t.id == data.roomid);
            table && table.enterTable(socket, data.username, data.userid);
        }
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.OnCheckReconnectGame = function (socket, data) {
    try {
        // gamelog.showlog(
        //     "-CheckReconnect",
        //     // socket.room,
        //     // socket.username,
        //     // socket.userid,
        //     // socket.id
        // )
        let table = tables.find((t) => t.id == data.roomid);
        table && table.reJoinTable(socket, data.username, data.userid);
    } catch (e) {

    }
};

function createTable(
    username,
    userid,
    maxPlayers,
    bb,
    min_buyin,
    max_buyin,
    gameMode,
    socket
) {
    try {
        let smallblind = fixNumber(bb) / 2;
        let bigblind = fixNumber(bb);
        let possibleBots = true;
        // if(bigBlinds.indexOf(bigblind) == -1)
        // {
        //     possibleBots = false;
        // }

        let tableIDs = new Array();
        for (let i = 0, length = tables.length; i < length; i++) {
            tableIDs.push(tables[i].id);
        }
        let tableID = createID_table(tableIDs);

        let table_data = {
            tableID: tableID,
            title: "poker table",
            socketio: io,
            database: database,
            status: 0,
            gameMode: gameMode,
            smallBlind: smallblind,
            bigBlind: bigblind,
            minPlayers: gameMode == "cash" ? 2 : 5,
            maxPlayers: fixNumber(maxPlayers),
            minBuyin: fixNumber(min_buyin),
            maxBuyin: fixNumber(max_buyin),
            possibleBots: possibleBots,
        };
        const table = new TableManager(table_data);
        tables.push(table);
        let tableCollection = database.collection("Table_Data");
        tableCollection.insertOne({
            type: "Create",
            id: tableID
        })
        table.initialize(table);
        table.setInstance(table);
        table.enterTable(socket, username, userid);


    } catch (error) {
        //gamelog.showlog(error);
    }
}

let getPhotos = function () {
    setInterval(() => {
        getPhotoLinks();
        checkTables();
    }, 6000);
};

let checkTables = function () {
    try {
        //gamelog.showlog("checktables");
        //gamelog.showlog("server running!");
        for (let index = 0; index < tables.length; index++) {
            const table = tables[index];
            if (table.onlyBotsLive()) exports.removeTable(table);
        }
    } catch (error) {
        //gamelog.showlog(error);
    }
};

let getPhotoLinks = function () {
    try {
        let collection_photo = database.collection("Photo_Data");
        collection_photo.find().toArray(function (err, docs) {
            if (!err) {
                if (docs.length > 0) {
                    realPhotos = docs[0].urls;
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.addChipsTouserInTable = function (tableid, userid, points) {
    let table = tables.find((t) => t.id == tableid);
    table && table.AddChipsUser(userid, points);
};

exports.minusChipsTouserInTable = function (tableid, userid, points) {
    let table = tables.find((t) => t.id == tableid);
    table && table.MinusChipsUser(userid, points);
};

exports.getBotUrl = function (table) {
    try {
        let newIndex = -1;
        for (let i = 0; i < realNames.length; i++) {
            const botName = realNames[i];
            if (!usedBotNames.includes(botName)) {
                newIndex = i;
                break;
            }
        }
        if (newIndex == -1) {
            usedBotNames = [];
            newIndex = 0;
        }
        usedBotNames.push(realNames[newIndex]);
        return { url: realPhotos[newIndex], name: realNames[newIndex] };
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.getBotName = function (table) {
    try {
        let allBotNames = [];
        for (let index = 0; index < tables.length; index++) {
            const t = tables[index];
            t.botNames = [];
            for (let j = 0; j < t.table.players.length; j++) {
                const element = t.table.players[j];
                if (element != null) {
                    t.botNames.push(element.playerName);
                }
            }
            allBotNames = allBotNames.concat(t.botNames);
        }
        let _username = "";
        shuffle(realNames);
        for (let i = 0; i < realNames.length; i++) {
            const p = realNames[i];
            if (allBotNames.indexOf(p) == -1) {
                _username = p;
                break;
            }
            if (realNames.length - 1 == i) {
                let random = Math.floor(Math.random() * realNames.length);
                _username = realNames[random];
                // _username = realNames[0];
            }
        }
        table.botNames.push(_username);
        return _username;
    } catch (error) {
        //gamelog.showlog(error);
    }
};

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

function createID_table(idArray) {
    try {
        let found = false;
        let tableID;
        while (!found) {
            tableID = makeRandomID();
            if (idArray.length == 0) found = true;
            if (idArray.find((id) => id == tableID)) found = false;
            else found = true;
        }
        //gamelog.showlog(tableID, " Table ID");
        return tableID;
    } catch (error) {
        //gamelog.showlog(error);
    }
}

function makeRandomID() {
    let randomNum1 = "" + Math.floor(100 + Math.random() * 900);
    let randomNum2 = "" + Math.floor(100 + Math.random() * 900);
    let randomID = randomNum1 + randomNum2;
    return randomID;
}

function fixNumber(str) {
    let newStr = str.toString().replace(/\,/g, "");
    let _fixnumber = Number(newStr);
    return _fixnumber;
}

exports.SitDown = function (info, socket) {
    let table = tables.find((t) => t.id == info.room_id);
    table && table.sitDown(info, socket);
};

exports.StandUp = function (info, socket) {
    let table = tables.find((t) => t.id == info.room_id);
    table && table.standUp(info);
};

exports.Leave = function (info, socket) {
    let table = tables.find((t) => t.id == info.room_id);
    //gamelog.showlog("table count:", tables.length);
    table && table.standUp_forever(info, socket);
};

exports.Buyin = function (info, socket) {
    let table = tables.find((t) => t.id == info.room_id);
    table && table.buyIn(info, socket);
};

exports.WaitingPlayers = function (info, socket) {
    let table = tables.find((t) => t.id == info.room_id);
    table && table.WaitingPlayers(info, socket);
};

exports.Action = function (info) {
    let table = tables.find((t) => t.id == info.room_id);
    table && table.action(info);
};

exports.PreAction = function (info) {
    let table = tables.find((t) => t.id == info.room_id);
    table && table.preaction(info);
}

exports.OnDisconnect = function (socket) {
    try {
        // gamelog.showlog(
        //     "-Disconnect",
        //     socket.room,
        //     socket.username,
        //     socket.userid,
        //     socket.id
        // );
        let query = { username: socket.username, userid: socket.userid };
        let collection_UserData = database.collection("User_Data");
        collection_UserData.findOne(query, (err, result) => {
            if (err) throw ("in_points:", err);
            else if (result) {
                collection_UserData.updateOne(
                    query,
                    { $set: { connect: "" } },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
        });

        let username = socket.username;
        let userid = socket.userid;
        let collection = database.collection("User_Data");
        if (userid == undefined)
            query = {
                connect: socket.id,
            };
        else
            query = {
                userid: userid,
            };
        // collection.updateOne(
        //     query,
        //     {
        //         $set: {
        //             connect: "",
        //             connected_room: "",
        //         },
        //     },
        //     function (err) {
        //         if (err) throw err;
        //     }
        // );
        if (socket.room == undefined || userid == undefined) return;
        let roomid_arr = socket.room.split("");
        roomid_arr.splice(0, 1);
        let roomid = "";
        for (let i = 0; i < roomid_arr.length; i++) {
            roomid += roomid_arr[i];
        }
        let table = tables.find((t) => t.id == roomid);
        let info = {
            username: username,
            userid: userid,
        };
        table && table.networkOffline(info, socket);
    } catch (error) {
        //gamelog.showlog(error);
    }
};
function creating(socket, data, botCounts) {
    let roomID;
    CreateRoom(
        data.seatlimit,
        parseInt(data.bigblind),
        parseInt(data.min_buyin),
        parseInt(data.max_buyin),
        data.mode
    )
        .then((roomid) => {
            roomID = roomid;
        })
        .then(() => {
            gamemanager.playerenterroom(
                roomID,
                data.userid,
                parseInt(data.balance),
                data.avatar,
                data.photoUrl,
                data.photoType,
                socket
            );
        });
    setTimeout(() => {
        let count = 0;
        let interval = setInterval(() => {
            count++;
            if (count <= botCounts) {
                exports.enterroom_bot(roomID, parseInt(data.min_buyin));
            } else {
                clearInterval(interval);
            }
        }, 200);
    }, 1000);
}

exports.JoinRoom_Bot = function (data) {
    try {
        let roomID;
        let tables = gamemanager
            .getroomlist()
            .filter(
                (t) =>
                    t.seatlimit == data.seatlimit &&
                    t.gamemode == data.mode &&
                    gamemanager.getPlayersSitted(t) < data.seatlimit
            );
        if (tables.length > 0) {
            roomID = tables[0].roomid;
            gamemanager.playerenterroom_bot(
                roomID,
                data.username,
                parseInt(data.balance),
                data.avatar
            );
        } else {
            CreateRoom(
                data.seatlimit,
                parseInt(data.bigblind),
                parseInt(data.balance),
                parseInt(data.balance),
                data.mode
            )
                .then((roomid) => {
                    roomID = roomid;
                })
                .then(function () {
                    gamemanager.playerenterroom_bot(
                        roomID,
                        data.username,
                        parseInt(data.balance),
                        data.avatar
                    );
                });
        }
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.RandomBots = function () {
    setTimeout(() => {
        let count = 0;
        let interval = setInterval(() => {
            count++;
            if (count <= 50) {
                createBots_first(9);
            } else {
                clearInterval(interval);
            }
        }, 500);
    }, 500);
};

function createBots_first(seatlimit) {
    try {
        let randomnum1 = "" + Math.floor(100 + Math.random() * 900);
        let randomnum2 = "" + Math.floor(1000 + Math.random() * 9000);
        let randomnum = randomnum1 + randomnum2;
        let username = "Guest" + randomnum;
        let data = {
            seatlimit: seatlimit,
            bigblind: 0,
            balance: 1000000000,
            username: username,
            avatar: Math.floor(Math.random() * 12) + 1,
            mode: "tournament",
        };
        exports.JoinRoom_Bot(data);
    } catch (error) {
        //gamelog.showlog(error);
    }
}

var botnames = [];

exports.enterroom_bot = function (roomid, buyin) {
    try {
        let username = "";
        while (true) {
            let randomnum1 = "" + Math.floor(100 + Math.random() * 900);
            let randomnum2 = "" + Math.floor(1000 + Math.random() * 9000);
            let randomnum = randomnum1 + randomnum2;
            username = "Guest" + randomnum;
            if (
                username != "" &&
                botnames.filter((n) => n == username).length == 0
            ) {
                botnames.push(username);
                break;
            }
        }
        let balance = buyin;
        let avatar = Math.floor(Math.random() * 12) + 1;
        gamemanager.playerenterroom_bot(roomid, username, balance, avatar);
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.CheckRefferal = function (socket, data) {
    try {
        let requester = data.userid;
        let code = data.referral;
        let bonus = 1000000000;
        let collection = database.collection("User_Data");
        collection.find().toArray(function (err, docs) {
            if (!err) {
                if (docs.length > 0) {
                    let users = docs.filter(function (object) {
                        return object.referral_code == code;
                    });

                    if (users.length > 0) {
                        let checkings = users[0].referral_users.filter(
                            (x) => x == requester
                        );
                        if (checkings.length == 0) {
                            let emitdata = {
                                result: "success",
                                bonus: bonus,
                            };
                            in_points(data.userid, bonus);
                            socket.emit("REQ_CHECK_REFFERAL_RESULT", emitdata);
                            let referral_users = [];
                            referral_users = users[0].referral_users;
                            referral_users.push(requester);
                            let query2 = {
                                userid: users[0].userid,
                            };
                            io.sockets.emit("SHARE_REFFERAL_SUCCESS", {
                                username: users[0].username,
                                bonus: bonus,
                                requester: data.username,
                            });
                            in_points(users[0].userid, bonus);
                            collection.updateOne(
                                query2,
                                {
                                    $set: {
                                        referral_count:
                                            users[0].referral_count + 1,
                                        referral_users: referral_users,
                                    },
                                },
                                function (err) {
                                    if (err) throw err;
                                }
                            );
                        } else {
                            let emitdata = {
                                result: "failed",
                                message: "You already used this code",
                            };
                            socket.emit("REQ_CHECK_REFFERAL_RESULT", emitdata);
                        }
                    } else {
                        let emitdata = {
                            result: "failed",
                            message: "Wrong code",
                        };
                        socket.emit("REQ_CHECK_REFFERAL_RESULT", emitdata);
                    }
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.SHARE_REFFERAL_SUCCESS_RESULT = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let query = {
            userid: data.userid,
        };
        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error22", err);
            else {
                let referral_count = result.referral_count;
                if (referral_count > 0) referral_count--;
                collection.updateOne(
                    query,
                    {
                        $set: {
                            referral_count: referral_count,
                        },
                    },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Friend = function (data) {
    try {
        let collection = database.collection("User_Data");
        let userid = data.userid;
        let friend_id = data.friend_id;
        let query = {
            userid: userid,
        };
        collection.findOne(query, function (err, result) {
            if (err) { }//  gamelog.showlog("error23", err);
            else {
                if (result != null) {
                    let Friends = [];
                    Friends = result.friends;
                    let nFriends = [...new Set(Friends)];
                    Friends = nFriends;
                    let friend = {
                        id: friend_id,
                        accepted: false,
                    };
                    console.log(userid, friend_id);
                    let buff = Friends.filter((x) => x.id == friend_id);
                    if (buff.length == 0) {
                        Friends.push(friend);
                        collection.updateOne(
                            query,
                            {
                                $set: {
                                    friends: Friends,
                                },
                            },
                            function (err) {
                                if (err) throw err;
                            }
                        );
                        let query1 = {
                            userid:friend_id
                        }
                        collection.findOne(query1, function (err, result1) {
                            console.log(result1);
                            if (result1 == null) {
                                console.log("bot")
                            }
                            else {
                                if (err) { }//  gamelog.showlog("error23", err);
                                else {
                                    let emitdata = {
                                        result: "success",
                                        userid: userid,
                                        friend_id: friend_id,
                                    };
                                        io.to(result1.connect).emit("REQ_FRIEND_RESULT", emitdata);
                                }
                            }
                            });
                    }
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Accept_Friend = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let userid = data.userid;
        let friend_id = data.friend_id;
        console.log(friend_id);
        let query1 = {
            userid: userid,
        };

        collection.findOne(query1, function (err, result) {
            if (err){} //  gamelog.showlog("error24", err);
            else {
                if (result != null) {
                    let Friends = result.friends;
                    let count = 0;
                    let nFriends = [...new Set(Friends)];
                    Friends = nFriends;
                    for (let j = 0; j < Friends.length; j++) {
                        if (Friends[j].id == friend_id) {
                            Friends[j].accepted = true;
                            count++;
                        }
                    }
                    if (count > 1) {
                        //gamelog.showlog("SO BAD");
                        let jsonData = {
                            userid: userid,
                        };
                        exports.Request_Buddies_List(socket, jsonData);
                    }

                    setTimeout(() => {
                        collection.updateOne(
                            query1,
                            {
                                $set: {
                                    friends: Friends,
                                    buddies: Friends.length,
                                },
                            },
                            function (err) {
                                if (err) throw err;
                            }
                        );
                    }, 100);
                }
            }
        });

        console.log(friend_id, "friedn_dffdfdfdfdfdf");

        let query = {
            userid: friend_id,
        };
        
        collection.findOne(query, function (err, result1) {
            console.log(result1, "123123");
            if (err){console.log("errorororrorrororor")} //  gamelog.showlog("error25", err);
            else {
                console.log(result1);
                let _Friends = [];
                _Friends = result1.friends;
                let buff = _Friends.filter((x) => x.id == userid);
                if (buff == 0) {
                    _Friends.push({
                        id: userid,
                        accepted: true,
                    });
                    setTimeout(() => {
                        collection.updateOne(
                            query,
                            {
                                $set: {
                                    friends: _Friends,
                                    buddies: _Friends.length,
                                },
                            },
                            function (err) {
                                if (err) throw err;
                                else {
                                    let jsonData = {
                                        userid: userid,
                                    };
                                    exports.Request_Buddies_List(
                                        socket,
                                        jsonData
                                    );
                                }
                            }
                        );
                    }, 100);
                }
            }
        });

        let jsonData = {
            userid: userid,
        };

        exports.Request_Buddies_List(socket, jsonData);

    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Cancel_Friend = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let userid = data.userid;
        let friend_id = data.friend_id;
        let query1 = {
            userid: userid,
        };
        console.log(data);
        collection.findOne(query1, function (err, result) {
            if (err){} //  gamelog.showlog("error26", err);
            else {
                if (result != null) {
                    let Friends = [];
                    Friends = result.friends;
                    let nFriends = [...new Set(Friends)];
                    Friends = nFriends;
                    for (let i = 0; i < Friends.length; i++) {
                        if (Friends[i].id == friend_id) {
                            Friends.splice(i, 1);
                            i--;
                        }
                    }
                    collection.updateOne(
                        query1,
                        {
                            $set: {
                                friends: Friends,
                                buddies: Friends.length,
                            },
                        },
                        function (err) {
                            if (err) throw err;
                        }
                    );
                }
            }
        });
        let query2 = {
            userid: friend_id,
        };
        collection.findOne(query2, function (err, result) {
            if (err){} //  gamelog.showlog("error27", err);
            else {
                if (result != null) {
                    let Friends = [];
                    Friends = result.friends;
                    let nFriends = [...new Set(Friends)];
                    Friends = nFriends;
                    for (let i = 0; i < Friends.length; i++) {
                        if (Friends[i].id == userid) {
                            Friends.splice(i, 1);
                            i--;
                        }
                    }
                    collection.updateOne(
                        query2,
                        {
                            $set: {
                                friends: Friends,
                                buddies: Friends.length,
                            },
                        },
                        function (err) {
                            if (err) throw err;
                        }
                    );
                }
            }
        });
        let emitdata = {
            result: "success",
            userid: userid,
        };
        socket.emit("CANCEL_FRIEND_RESULT", emitdata);
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Buddies_List = function (socket, data) {
    try {
        let collection = database.collection("User_Data");

        let userid = data.userid;

        let query = {
            userid: userid,
        };

        let myfriends = [];

        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error28", err);
            else {
                if (result != null) {
                    let Friends = result.friends;
                    let nFriends = [...new Set(Friends)];
                    Friends = nFriends;
                    let counter = Friends.length;
                    const a = [];
                    for (let i = 0; i < counter; i++) {
                        a.push(
                            new Promise((resolve, reject) => {
                                let id = Friends[i].id;
                                let accepted = Friends[i].accepted;
                                let query1 = {
                                    userid: id,
                                };
                                collection.findOne(
                                    query1,
                                    function (err, result1) {
                                        if (err) {
                                            //gamelog.showlog("error29", err);
                                            //counter--;
                                        } else {
                                            //counter--;
                                            if (result1 != null) {
                                                let check_online = false;
                                                if (result1.connect == "")
                                                    check_online = false;
                                                else check_online = true;
                                                let connectedRoom = {
                                                    roomid: -1,
                                                    sb: 0,
                                                    bb: 0,
                                                    minBuyin: 0,
                                                    maxBuyin: 0,
                                                    maxSeats: 0,
                                                };
                                                if (
                                                    result1.connected_room == ""
                                                ) {
                                                    connectedRoom = {
                                                        roomid: -1,
                                                        sb: 0,
                                                        bb: 0,
                                                        minBuyin: 0,
                                                        maxBuyin: 0,
                                                        maxSeats: 0,
                                                    };
                                                } else {
                                                    let table = tables.find(
                                                        (t) =>
                                                            t.id ==
                                                            result1.connected_room
                                                    );
                                                    if (table) {
                                                        let sb =
                                                            table.smallBlind;
                                                        let bb = table.bigBlind;
                                                        let min_buyin =
                                                            table.minBuyin;
                                                        let max_buyin =
                                                            table.maxBuyin;
                                                        let max_seats =
                                                            table.maxPlayers;
                                                        connectedRoom = {
                                                            roomid: result1.connected_room,
                                                            sb: sb,
                                                            bb: bb,
                                                            minBuyin: min_buyin,
                                                            maxBuyin: max_buyin,
                                                            maxSeats: max_seats,
                                                        };
                                                    }
                                                }
                                                let f = {
                                                    friend_id: result1.userid,
                                                    friend_name:
                                                        result1.username,
                                                    friend_photoIndex:
                                                        result1.photo_index,
                                                    friend_photo: result1.photo,
                                                    friend_photoType:
                                                        result1.photo_type,
                                                    friend_connected_room:
                                                        connectedRoom,
                                                    friend_online: check_online,
                                                    accepted: accepted,
                                                };
                                                myfriends.push(f);
                                                resolve(true);
                                            } else {
                                                resolve(true);
                                            }
                                        }
                                    }
                                );
                            })
                        );
                    }
                    Promise.all(a).then((values) => {
                        let emitdata = {
                            result: "success",
                            userid: userid,
                            friends: myfriends,
                        };
                        socket.emit("REQ_BUDDIES_RESULT", emitdata);
                    })
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Buddies_List1 = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let userid = data.userid;
        let query = {
            userid: userid,
        };
        let myfriends = [];
        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error28", err);
            else {
                if (result != null) {
                    let Friends = result.friends;
                    let nFriends = [...new Set(Friends)];
                    Friends = nFriends;
                    let counter = Friends.length;

                    const a = [];
                    for (let i = 0; i < counter; i++) {
                        a.push(
                            new Promise((resolve, reject) => {
                                let id = Friends[i].id;
                                let accepted = Friends[i].accepted;
                                let query1 = {
                                    userid: id,
                                };
                                collection.findOne(
                                    query1,
                                    function (err, result1) {
                                        if (err) {
                                            // gamelog.showlog("error29" + err, 1);
                                            //counter--;
                                        } else {
                                            //counter--;
                                            if (result1 != null) {
                                                let check_online = false;
                                                if (result1.connect == "")
                                                    check_online = false;
                                                else check_online = true;
                                                let connectedRoom = {
                                                    roomid: -1,
                                                    sb: 0,
                                                    bb: 0,
                                                    minBuyin: 0,
                                                    maxBuyin: 0,
                                                    maxSeats: 0,
                                                };
                                                if (
                                                    result1.connected_room == ""
                                                ) {
                                                    connectedRoom = {
                                                        roomid: -1,
                                                        sb: 0,
                                                        bb: 0,
                                                        minBuyin: 0,
                                                        maxBuyin: 0,
                                                        maxSeats: 0,
                                                    };
                                                } else {
                                                    let table = tables.find(
                                                        (t) =>
                                                            t.id ==
                                                            result1.connected_room
                                                    );
                                                    if (table) {
                                                        let sb =
                                                            table.smallBlind;
                                                        let bb = table.bigBlind;
                                                        let min_buyin =
                                                            table.minBuyin;
                                                        let max_buyin =
                                                            table.maxBuyin;
                                                        let max_seats =
                                                            table.maxPlayers;
                                                        connectedRoom = {
                                                            roomid: result1.connected_room,
                                                            sb: sb,
                                                            bb: bb,
                                                            minBuyin: min_buyin,
                                                            maxBuyin: max_buyin,
                                                            maxSeats: max_seats,
                                                        };
                                                    }
                                                }
                                                let f = {
                                                    friend_id: result1.userid,
                                                    friend_name:
                                                        result1.username,
                                                    friend_photoIndex:
                                                        result1.photo_index,
                                                    friend_photo: result1.photo,
                                                    friend_photoType:
                                                        result1.photo_type,
                                                    friend_connected_room:
                                                        connectedRoom,
                                                    friend_online: check_online,
                                                    accepted: accepted,
                                                };
                                                myfriends.push(f);
                                                resolve(true);
                                            } else {
                                                resolve(true);
                                            }
                                        }
                                    }
                                );
                            })
                        );
                    }
                    Promise.all(a).then((values) => {
                        let emitdata = {
                            result: "success",
                            userid: userid,
                            friends: myfriends,
                        };
                        socket.emit("REQ_BUDDIES_RESULT1", emitdata);
                    });
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Recents_List = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let userid = data.userid;
        let query = {
            userid: userid,
        };
        let myfriends = [];
        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error21", err);
            else {
                if (result != null) {
                    let Friends = result.recents;
                    let buddies = result.friends;
                    let counter = Friends.length;
                    let i = 0;
                    const a = [];
                    for (i = 0; i < counter; i++) {
                        a.push(
                            new Promise((resolve, reject) => {
                                let id = Friends[i];
                                let requested = false;
                                let query1 = {
                                    userid: id,
                                };
                                collection.findOne(
                                    query1,
                                    function (err, result1) {
                                        if (err) {
                                            //gamelog.showlog("error29", err);
                                            //counter--;
                                        } else {
                                            //counter--;
                                            if (result1 != null) {
                                                let check_online = false;
                                                if (result1.connect == "")
                                                    check_online = false;
                                                else check_online = true;
                                                let connectedRoom = {
                                                    roomid: -1,
                                                    sb: 0,
                                                    bb: 0,
                                                    minBuyin: 0,
                                                    maxBuyin: 0,
                                                    maxSeats: 0,
                                                };
                                                if (result1.connected_room == "") {
                                                    connectedRoom = {
                                                        roomid: -1,
                                                        sb: 0,
                                                        bb: 0,
                                                        minBuyin: 0,
                                                        maxBuyin: 0,
                                                        maxSeats: 0,
                                                    };
                                                } else {
                                                    let table = tables.find(
                                                        (t) =>
                                                            t.id ==
                                                            result1.connected_room
                                                    );
                                                    if (table) {
                                                        let sb = table.smallBlind;
                                                        let bb = table.bigBlind;
                                                        let min_buyin = table.minBuyin;
                                                        let max_buyin = table.maxBuyin;
                                                        let max_seats = table.maxPlayers;
                                                        connectedRoom = {
                                                            roomid: result1.connected_room,
                                                            sb: sb,
                                                            bb: bb,
                                                            minBuyin: min_buyin,
                                                            maxBuyin: max_buyin,
                                                            maxSeats: max_seats,
                                                        };
                                                    }
                                                }
                                                for (let j = 0; j < result1.friends.length; j++) {
                                                    if (result1.friends[j].id == userid) {
                                                        requested = true;
                                                        break;
                                                    }
                                                }
                                                let f = {
                                                    friend_id: result1.userid,
                                                    friend_name:
                                                        result1.username,
                                                    friend_photoIndex:
                                                        result1.photo_index,
                                                    friend_photo: result1.photo,
                                                    friend_photoType:
                                                        result1.photo_type,
                                                    friend_connected_room:
                                                        connectedRoom,
                                                    friend_online: check_online,
                                                    alreadyFriend:
                                                        buddies.filter(
                                                            (buddy) =>
                                                                buddy.id == id
                                                        ).length > 0
                                                            ? true
                                                            : false,
                                                    requested: requested,
                                                };
                                                myfriends.push(f);
                                                resolve(true);
                                            } else {
                                                resolve(true);
                                            }
                                        }
                                    }
                                );
                            })
                        );
                    }
                    let resolveData = Promise.all(a);
                    resolveData.then((values) => {
                        let emitdata = {
                            result: "success",
                            userid: userid,
                            recents: myfriends,
                        };
                        socket.emit("REQ_RECENTS_RESULT", emitdata);
                    });

                    // let interval = setInterval(() => {
                    // 	i++;
                    // 	if (i < counter) {

                    // 	} else {

                    // 		clearInterval(interval);
                    // 	}
                    // }, 200);
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

// send a chat-message
exports.SendMessage = function (socket, data) {
    try {
        let collection = database.collection("Chat_Data");
        let collection1 = database.collection("User_Data");
        collection.insertOne(data, function (err) {
            if (err) {
                //gamelog.showlog("error30", err);
                throw err;
            } else {
                let query_send = {
                    userid: data.sender_id,
                };
                collection1.findOne(query_send, function (err, result) {
                    if (err){} //  gamelog.showlog("error31", err);
                    else {
                        if (result != null) {
                            let jsonData = {
                                sender: data.sender_id,
                                photo: result.photo,
                                photo_index: result.photo_index,
                                photo_type: result.photo_type,
                                message: data.message,
                                receiver: data.receiver_id,
                            };

                            io.sockets.emit("RECEIVE_CHAT", jsonData);
                        }
                    }
                });
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.InviteRoom = function (data) {
    const receiver_id = data.receiver_id;
    let collection = database.collection("User_Data");
    let query = {
        userid:receiver_id
    }
    collection.findOne(query, function (err, result) {
        if (err) { }
        else {
            console.log(result);
            io.to(result.connect).emit("GET_INVITE_RESULT", data);           
        }
    });
};

exports.CheckUserMessage = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let query = { userid: data.userid };
        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error41", err);
            else {
                if (result != null) {
                    if (result.messages != undefined) {
                        let msg = result.messages;
                        msg.splice(data.index, 1);
                        //socket.emit('REQ_MESSAGES_RESULT', { messages: msg });
                        collection.updateOne(
                            query,
                            {
                                $set: {
                                    messages: msg,
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
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.GetUserMessages = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let query = { userid: data.userid };
        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error41", err);
            else {
                if (result != null) {
                    if (result.messages != undefined) {
                        // socket.emit('REQ_MESSAGES_RESULT', { messages: result.messages });
                    }
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_User_Balance = function (socket, data) {
    try {
        let collection = database.collection("User_Data");
        let query = { userid: data.userid };
        collection.findOne(query, function (err, result) {
            if (err){} //  gamelog.showlog("error32", err);
            else {
                let num = 0;
                if (!result && result === null) {
                    collection.updateOne(
                        query,
                        { $set: { points: parseInt(num) } },
                        function (err) {
                            if (err) throw err;
                        }
                    );
                } else num = result.points;
                socket.emit("REQ_MyChips_RESULT", {
                    userid: data.userid,
                    points: num,
                });
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Chat_List = function (socket, data) {
    try {
        let collection1 = database.collection("Chat_Data");
        let userid = data.my_id;
        let otherid = data.other_id;

        let chats = [];
        collection1.find().toArray(function (err, docs) {
            if (!err) {
                if (docs.length > 0) {
                    chats = docs.filter(function (object) {
                        return (
                            (object.sender_id == userid &&
                                object.receiver_id == otherid) ||
                            (object.receiver_id == userid &&
                                object.sender_id == otherid)
                        );
                    });
                }
            }
        });
        let Interval = setInterval(() => {
            if (chats != null) {
                let emitdata = {
                    result: "success",
                    otherid: data.other_id,
                    chat_data: chats,
                };
                socket.emit("REQ_CHATS_RESULT", emitdata);
                clearInterval(Interval);
            }
        }, 200);
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.Request_Chat_List1 = function (socket, data) {
    try {
        let collection1 = database.collection("Chat_Data");
        let userid = data.my_id;
        let otherid = data.other_id;

        let chats = [];
        collection1.find().toArray(function (err, docs) {
            if (!err) {
                if (docs.length > 0) {
                    chats = docs.filter(function (object) {
                        return (
                            (object.sender_id == userid &&
                                object.receiver_id == otherid) ||
                            (object.receiver_id == userid &&
                                object.sender_id == otherid)
                        );
                    });
                }
            }
        });
        let Interval = setInterval(() => {
            if (chats != null) {
                let emitdata = {
                    result: "success",
                    otherid: data.other_id,
                    chat_data: chats,
                };
                socket.emit("REQ_CHATS_RESULT1", emitdata);
                clearInterval(Interval);
            }
        }, 200);
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.GetTotalUsers = function () {
    try {
        var collection = database.collection("User_Data");
        collection.find().toArray(function (err, docs) {
            if (err){} //  gamelog.showlog("error33", err);
            else {
                var message = {
                    message: docs.length,
                };

                io.sockets.emit("GET_TOTAL_USERS_RESULT", message);
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.GetOnlineUsers = function () {
    try {
        var collection = database.collection("User_Data");
        collection.find().toArray(function (err, docs) {
            var count = 0;
            for (let index = 0; index < docs.length; index++) {
                const element = docs[index];
                if (element.connect != "") count++;
            }
            var message = {
                message: "" + count,
            };
            io.sockets.emit("GET_ONLINE_USERS_RESULT", message);
        });
    } catch (error) {
       // gamelog.showlog(error);
    }
};

exports.GetUserList = function () {
    try {
        let collection = database.collection("User_Data");
        collection.find().toArray(function (err, docs) {
            if (err){} //  gamelog.showlog("error34", err);
            else {
                var mydata = "";
                for (let i = 0; i < docs.length; i++) {
                    mydata =
                        mydata +
                        "{" +
                        '"id":"' +
                        i +
                        '",' +
                        '"username":"' +
                        docs[i].username +
                        '",' +
                        '"photoIndex":"' +
                        docs[i].photo_index +
                        '",' +
                        '"photoType":"' +
                        docs[i].photo_type +
                        '",' +
                        '"photoUrl":"' +
                        docs[i].photo +
                        '",' +
                        '"id":"' +
                        docs[i].userid +
                        '",' +
                        '"balance":"' +
                        docs[i].points +
                        '"},';
                }

                mydata = mydata.substring(0, mydata.length - 1);
                mydata = "{" + '"users"  : [' + mydata;
                mydata = mydata + "]}";
                io.sockets.emit("GET_USER_LIST_RESULT", JSON.parse(mydata));
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
};

exports.GetVerify = function (socket) {
    let collection = database.collection("User_Data");
    collection.deleteMany(function (err, removed) {
        if (err) {
            //gamelog.showlog("error21", err);
        } else {
            //gamelog.showlog("Deleted");
            socket.emit("GET_VERIFY_RESULT", { result: "success" });
        }
    });
};

function in_points(userid, in_points) {
    try {
        var collection = database.collection("User_Data");
        var query = { userid: userid };
        collection.findOne(query, function (err, result) {
            if (err) throw ("in_points:", err);
            else if (result) {
                let mypoints = result.points;
                mypoints = mypoints + parseInt(in_points);
                collection.updateOne(
                    query,
                    { $set: { points: parseInt(mypoints) } },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
}

function out_points(userid, out_points) {
    try {
        var collection = database.collection("User_Data");
        var query = { userid: userid };
        collection.findOne(query, function (err, result) {
            if (err) throw ("out_points:", err);
            else if (result) {
                let mypoints = result.points;
                mypoints = mypoints - parseInt(out_points);
                collection.updateOne(
                    query,
                    { $set: { points: parseInt(mypoints) } },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
}

function roundNum(n) {
    let units = n.toString().length;
    let remains = 0;
    if (units % 3 == 0) remains = (units / 3 - 1) * 3;
    else remains = units - (units % 3);
    let a = Math.trunc(n / 10 ** remains) * 10 ** remains;
    return a;
}

var realPhotos = [
    "https://i.ibb.co/7zj7MmL/1.png",
    "https://i.ibb.co/tY9gv3C/2.png",
    "https://i.ibb.co/12xRXt2/3.png",
    "https://i.ibb.co/ypH2V2g/4.png",
    "https://i.ibb.co/pZHjncf/5.png",
    "https://i.ibb.co/MRLs54t/6.png",
    "https://i.ibb.co/L1jmXxj/7.png",
    "https://i.ibb.co/fDQSf60/8.png",
    "https://i.ibb.co/rbHPhVZ/9.png",
    "https://i.ibb.co/rGNn4sL/10.png",
    "https://i.ibb.co/dgQBjNg/11.png",
    "https://i.ibb.co/WfR1xwm/12.png",
    "https://i.ibb.co/3yjMKNg/13.png",
    "https://i.ibb.co/89KYBZQ/14.png",
    "https://i.ibb.co/2yJqhYc/15.png",
    "https://i.ibb.co/NKqTrmp/16.png",
    "https://i.ibb.co/kXnpLTb/17.png",
    "https://i.ibb.co/x7Tc2Y2/18.png",
    "https://i.ibb.co/RPdg1cz/19.png",
    "https://i.ibb.co/k9bnXST/20.png",
    "https://i.ibb.co/1bSXzXk/21.png",
    "https://i.ibb.co/gJbzGFr/22.png",
    "https://i.ibb.co/SBbJKjw/23.png",
    "https://i.ibb.co/mGM9qtX/24.png",
    "https://i.ibb.co/2KvCCMH/25.png",
    "https://i.ibb.co/72V3ct3/26.png",
    "https://i.ibb.co/9Z7kMkQ/27.png",
    "https://i.ibb.co/DLGvfzv/28.png",
    "https://i.ibb.co/bsR6jrD/29.png",
    "https://i.ibb.co/nfmZyPx/30.png",
    "https://i.ibb.co/CtxCvQx/31.png",
    "https://i.ibb.co/qdhZFL9/32.png",
    "https://i.ibb.co/7nnk6bS/33.png",
    "https://i.ibb.co/LvqvWt9/34.png",
    "https://i.ibb.co/q92V589/35.png",
    "https://i.ibb.co/LCSLns2/36.png",
    "https://i.ibb.co/1ZB7K4d/37.png",
    "https://i.ibb.co/qdNDRKd/38.png",
    "https://i.ibb.co/4pcYV10/39.png",
    "https://i.ibb.co/RBHdC8f/40.png",
    "https://i.ibb.co/vwR0hdQ/41.png",
    "https://i.ibb.co/qpyZnLf/42.png",
    "https://i.ibb.co/wWcjVqX/43.png",
    "https://i.ibb.co/fFz69KL/44.png",
    "https://i.ibb.co/R45TbLD/45.png",
    "https://i.ibb.co/k3WRg5N/46.png",
    "https://i.ibb.co/1RZ7TQC/47.png",
    "https://i.ibb.co/FHxxJgD/48.png",
    "https://i.ibb.co/4jrj2W7/49.png",
    "https://i.ibb.co/RD62XVc/50.png",
    "https://i.ibb.co/r07bmWs/51.png",
    "https://i.ibb.co/G3BYbCF/52.png",
    "https://i.ibb.co/82twV0B/53.png",
    "https://i.ibb.co/MsrQpWK/54.png",
    "https://i.ibb.co/zJbSxhj/55.png",
    "https://i.ibb.co/yWPNdKD/56.png",
    "https://i.ibb.co/PMVgcfV/57.png",
    "https://i.ibb.co/s1VZn7R/58.png",
    "https://i.ibb.co/8cv3kwT/59.png",
    "https://i.ibb.co/pQ4H1f4/60.png",
    "https://i.ibb.co/X4rDBVg/61.png",
    "https://i.ibb.co/wwrG1Tk/62.png",
    "https://i.ibb.co/N9tHRqD/63.png",
    "https://i.ibb.co/d2fQrDC/64.png",
    "https://i.ibb.co/YNY56LJ/65.png",
    "https://i.ibb.co/Ksf4pfQ/66.png",
    "https://i.ibb.co/ZMK3nSR/67.png",
    "https://i.ibb.co/8bvc8d9/68.png",
    "https://i.ibb.co/jwBJT2Z/69.png",
    "https://i.ibb.co/6BhMZYd/70.png",
    "https://i.ibb.co/mHVq7xD/71.png",
    "https://i.ibb.co/txWRy7P/72.png",
    "https://i.ibb.co/88cg5dh/73.png",
    "https://i.ibb.co/FJyNqrV/74.png",
    "https://i.ibb.co/Sd7q6s2/75.png",
    "https://i.ibb.co/4R5FTYr/76.png",
    "https://i.ibb.co/sWjX9Pb/77.png",
    "https://i.ibb.co/5x6Tjjk/78.png",
    "https://i.ibb.co/n8hYmG6/79.png",
    "https://i.ibb.co/XZwJL6x/80.png",
    "https://i.ibb.co/7KFytWL/81.png",
    "https://i.ibb.co/jvbNsfr/82.png",
    "https://i.ibb.co/SmkNgwc/83.png",
    "https://i.ibb.co/xCTFYv8/84.png",
    "https://i.ibb.co/wwmq0n7/85.png",
    "https://i.ibb.co/56xDWHB/86.png",
    "https://i.ibb.co/4dm0rwd/87.png",
    "https://i.ibb.co/BrKD0b7/88.png",
    "https://i.ibb.co/qY8K0rm/89.png",
    "https://i.ibb.co/qY8K0rm/89.png",
    "https://i.ibb.co/hHBLztD/91.png",
    "https://i.ibb.co/0Fn64Dp/92.png",
    "https://i.ibb.co/9bq004M/93.png",
    "https://i.ibb.co/fNhghjd/94.png",
    "https://i.ibb.co/hZFh59J/95.png",
    "https://i.ibb.co/z5ZdKBG/96.png",
    "https://i.ibb.co/XJbt215/97.png",
    "https://i.ibb.co/phqSdF4/98.png",
    "https://i.ibb.co/z67pThQ/99.png",
    "https://i.ibb.co/YZ4qXXT/100.png",
    "https://i.ibb.co/4JYBqbS/101.png",
    "https://i.ibb.co/r2fLZp2/102.png",
    "https://i.ibb.co/4KGX3hW/103.png",
    "https://i.ibb.co/d244wDS/104.png",
    "https://i.ibb.co/HByZPXv/105.png",
    "https://i.ibb.co/LhztQsZ/106.png",
    "https://i.ibb.co/LPHTCW5/107.png",
    "https://i.ibb.co/WzBQTkN/108.png",
    "https://i.ibb.co/HhZS8PH/109.png",
    "https://i.ibb.co/JvgZLkd/110.png",
    "https://i.ibb.co/bX1rb4y/111.png",
    "https://i.ibb.co/QcDRBnh/112.png",
    "https://i.ibb.co/HdrdhXv/113.png",
    "https://i.ibb.co/tx6DtD9/114.png",
    "https://i.ibb.co/BKLttg5/115.png",
    "https://i.ibb.co/drgXTFL/116.png",
    "https://i.ibb.co/qR5qrBX/117.png",
    "https://i.ibb.co/KmxDCrp/118.png",
    "https://i.ibb.co/wg3TMN6/119.png",
    "https://i.ibb.co/QK580QR/120.png",
];

var realNames = [
    "James",
    "Mary",
    "Patricia",
    "Aliza",
    "Robert",
    "John",
    "Michael",
    "William",
    "David",
    "Linda",
    "Richard",
    "Joseph",
    "Huang",
    "Thomas",
    "Charles",
    "Christopher",
    "Daniel",
    "Elizabeth",
    "Matthew",
    "Barbara",
    "Susan",
    "Anthony",
    "Mark",
    "Donald",
    "Jessica",
    "Sarah",
    "Steven",
    "Paul",
    "Andrew",
    "JoshuaEdward",
    "Kenneth",
    "Kevin",
    "Brian",
    "George",
    "Karen",
    "Nancy",
    "Edward",
    "Donna",
    "Michelle",
    "Dorothy",
    "Ronald",
    "Timothy",
    "Rebecca",
    "Jason",
    "Jeffrey",
    "Amanda",
    "Timothy",
    "Ryan",
    "Jacob",
    "Gary",
    "Nicholas",
    "Eric",
    "Jonathan",
    "Sharon",
    "Laura",
    "Cynthia",
    "Stephen",
    "Larry",
    "Justin",
    "Helen",
    "Scott",
    "Brandon",
    "Benjamin",
    "Samuel",
    "Gregory",
    "Anna",
    "Frank",
    "Pamela",
    "Alexander",
    "Raymond",
    "Patrick",
    "Jack",
    "Maria",
    "Heather",
    "Diane",
    "Virginia",
    "Dennis",
    "Jerry",
    "Aaron",
    "Julie",
    "Jose",
    "Adam",
    "Henry",
    "Nathan",
    "Kelly",
    "Douglas",
    "Zachary",
    "Peter",
    "Kyle",
    "Walter",
    "Ethan",
    "Jeremy",
    "Harold",
    "Megan",
    "Christian",
    "Gloria",
    "Terry",
    "Ann",
    "Austin",
    "Austin",
    "Arthur",
    "Lawrence",
    "Jesse",
    "Dylan",
    "Doris",
    "Willie",
    "Gabriel",
    "Logan",
    "Alan",
    "Ralph",
    "Randy",
    "Sophia",
    "Diana",
    "Brittany",
    "Natalie",
    "Louis",
    "Isabella",
    "Elijah",
    "Bobby",
    "Philip",
];
