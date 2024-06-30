'use strict'
var roommanager = require('../room_manager/roommanager');
var gamemanager = require('./gamemanager');
var botlog = require('./gamelog');
var Bot = require('./bot.js').Bot;
var Ranker = require('../module/handranker');
var names = [];
var bots = [];
// var pocketCards = ['AA','AK','AQ','AJ','AT','A9','A8','A7','A6','A5','A4','A3','KA','KK','KQ','KJ','KT','K9','K8','QA'
// ,'QK','QQ','QJ','QT','JA','JK','JQ','TA','TK','9A','8A','7A','6A','5A','4A','3A','9K','8K','TQ','JJ','TT','99','88','77','66','55']
var pocketCards = ['AA', 'KK', 'QQ', 'JJ', 'AK', 'KA', 'TT', 'AQ', 'QA', '99', 'AJ', 'JA', 'KQ', 'QK', 'AT', 'TA', '88', 'KJ', 'JK', 'KT', 'TK', 'QJ', 'JQ', 'QT', 'TQ',
    '88', '77', '66', '55', '44', '33', '22'];

var count = 0;

exports.createBots = function (data) {
    try {
        let randomnum1 = '' + Math.floor(100 + Math.random() * 900);
        let randomnum2 = '' + Math.floor(1000 + Math.random() * 9000);
        let randomnum = randomnum1 + randomnum2;
        let name = 'Guest' + randomnum;
        count++;
        let option = {
            seatlimit: data.seatlimit,
            bigblind: data.bigblind,
            username: name,
            balance: data.buyin,
            avatar: Math.floor(Math.random() * 12) + 1,
            mode: data.mode
        }
        roommanager.JoinRoom_Bot(option);
    } catch (error) {
        //gamelog.showlog(error);
    }
}
exports.getCount = function () {
    count++;
    return count;
}

exports.addBot = function (option) {
    let newBot = new Bot(option);
    bots.push(newBot);
}
exports.leaveBot = function (username) {
    //gamelog.showlog("-> splice bot in botManager");
    for (let i = 0; i < bots.length; i++) {
        const element = bots[i];
        if (element.playerName == username) {
            //gamelog.showlog('removed');
            //bots.splice(i, 1);
            break;
        }
    }
}
exports.getBot = function (username) {
    for (let i = 0; i < bots.length; i++) {
        const element = bots[i];
        if (element.playerName == username) {
            return i;
        }
    }
}
exports.roundstart = function (index) {
    try {
        let roomlist = gamemanager.getroomlist();
        roomlist[index].table.on("turn", function (player) {
            for (let i = 0; i < bots.length; i++) {
                const element = bots[i];
                if (element.playerName == player.playerName) {
                    if (element.roomid == roomlist[index].roomid) {
                        element.turn(index, roomlist[index].bigBlind, roomlist[index].legalbet, player);
                        //gamelog.showlog('turn>>', roomlist[index].roomid);
                        break;
                    }
                }
            }
        });

        roomlist[index].table.on("smallBlind", function (player) {
            //gamelog.showlog('smallBlind>>', roomlist[index].roomid);
            let players = roomlist[index].table.players;
            let ranked_players = [];
            let ranks = [];
            for (let i = 0; i < players.length; i++) {
                const element = players[i];
                //gamelog.showlog(element.playerName, element._GetHand().message,  element._GetHand().rank);
                ranks.push(element._GetHand().rank);
                ranked_players.push({ name: element.playerName, rank: element._GetHand().rank });
            }
            let maxHandRank = Math.max.apply(null, ranks);
            let maxRank_players = ranked_players.filter(x => x.rank == maxHandRank);

            for (let j = 0; j < bots.length; j++) {
                const _bot = bots[j];
                if (_bot.roomid == roomlist[index].roomid) {
                    _bot.getGameResult(maxRank_players);
                }
            }
        });
        roomlist[index].table.on("dealCards", function (boardCardCount, currnt_bets) {
            //gamelog.showlog('dealCards>>', roomlist[index].roomid);
            let mainpots = gamemanager.roundMainPots(currnt_bets);
            roomlist[index].mainPots = gamemanager.getMainPots(roomlist[index].mainPots, mainpots);
            // let roundName = roomlist[index].table.game.roundName;
            // if (roomlist[index].table != undefined) {
            //     if (roundName !== 'Showdown') {
            //         for (let i = 0; i < bots.length; i++) {
            //             const _bot = bots[i];
            //             if (_bot.roomid == roomlist[index].roomid) {
            //                 _bot.tableRound(roundName);
            //             }
            //         }
            //     }
            // }
        });
    } catch (error) {
        //gamelog.showlog(error);
    }
}
exports.movebots = function (from, to) {
    for (let i = 0; i < bots.length; i++) {
        const element = bots[i];
        if (element.roomid == from) {
            element.roomid = to;
        }
    }
}
