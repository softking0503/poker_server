"use strict";
var Poker = require("../module/poker-engine");
var Ranker = require("../module/handranker");
var colors = require("colors");
var roommanager = require("../room_manager/roommanager");
var gamelog = require('./gamelog');
const player = require("../module/poker-engine/lib/player");
colors.setTheme({
    info: "bgGreen",
    help: "cyan",
    warn: "yellow",
    success: "bgBlue",
    error: "red",
});

function TableManager(param) {
    this.id = param.tableID || 0;
    this.title = param.title;
    this.io = param.socketio;
    this.database = param.database;
    this.status = param.status;
    this.gameMode = param.gameMode;
    this.smallBlind = param.smallBlind;
    this.bigBlind = param.bigBlind;
    this.minBuyin = param.minBuyin;
    this.maxBuyin = param.maxBuyin;
    this.maxPlayers = param.maxPlayers;
    this.botCount = param.possibleBots
        ? param.gameMode == "cash"
            ? param.maxPlayers == 9
                ? config.Bots.array[0]
                : config.Bots.array[1]
            : param.maxPlayers == 5
                ? 4
                : 0
        : 0;
    this.botNames = [];
    this.botUrls = [];
    this.botIDs = [];
    this.currentTimeout = null;
    this.levelTimeout = null;
    this.breakTimeout = null;
    this.roundStartTime = null;
    this.level = 1;
    this.legalBet = 0;
    this.played = 0;
    this.startFlag = 0;
    this.totalPot = 0;
    this.mainPots = [];
    this.turn = false;
    this.isBreakTime = false;
    this.removed = false;
    this.showWinDelay = 1000;
    this.collection_UserData = this.database.collection("User_Data");
    this.maxRank_players = [];
    this.bigBlinds = [
        10000000, 100000000, 1000000000, 5000000000, 10000000000, 20000000000,
        50000000000,
    ];
    this.timer = setTimeout(() => {
        //config.Tour_SB_W.array
    }, 300000);
    this.hardCount = 4;
    this.royalFlash = 0;
    this.royal4kinds = 0;

    let ind = null;
    for (let i = 0; i < config.STAKES_SB.array.length; i++) {
        const element = config.STAKES_SB.array[i];
        if (this.smallBlind == element) {
            ind = i;
            break;
        }
    }

    if (ind != null) {
        this.royalFlash = parseInt(
            config.JACKPOT_WINS_ROYALFLASH
                .array[ind]
        )
        this.royal4kinds = parseInt(config.JACKPOT_WINS_4KINDS.array[ind])
    }

    this.table = Poker.newTable(
        {
            minBlind: param.smallBlind,
            maxBlind: param.bigBlind,
            minPlayers: param.minPlayers,
            maxPlayers: param.maxPlayers,
            royalFlash: this.royalFlash,
            royal4kinds: this.royal4kinds
        },
        []
    );
    this.players = [];
    this.instance = null;
    this.waitingPlayers = [];
    this.isRaise = false;
}
TableManager.prototype.initialize = function (tablemanager) {
    //gamelog.showlog(this.table + " roomID:" + this.id);
    this.table.on("roundDeal", function () {
        tablemanager.onRoundDeal();
    });
    this.table.on("smallBlind", function (player) {
        tablemanager.onSmallBlind(player);
    });
    this.table.on("bigBlind", function (player) {
        tablemanager.onBigBlind(player);
    });
    this.table.on("turn", function (player) {
        tablemanager.onTurn(player);
    });
    this.table.on("dealCards", function (boardCardCount, currntBets) {
        tablemanager.onDealCards(boardCardCount, currntBets);
    });
    this.table.on("roundShowdown", function (currntBets) {
        tablemanager.onRoundShowdown(currntBets);
    });
    this.table.on("win", function (winner, prize) {
        tablemanager.onWin(winner, prize);
    });
    this.table.on("gameOver", function () {
        tablemanager.onGameOver();
    });
    this.table.on("updatePlayer", function (player) {
        tablemanager.onUpdatePlayer(player);
    });
    this.table.on("returnChips", function (position, returnChip) {
        tablemanager.onReturnChips(position, returnChip);
    });
    this.table.on("Bankrupt", function (player) {
        tablemanager.onBankrupt(player);
    });
};
TableManager.prototype.setInstance = function (tablemanager) {
    this.instance = tablemanager;
};
TableManager.prototype.onRoundDeal = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("onRoundDeal" + " roomID:" + this.id);
    this.legalBet = 0;
    this.mainPots = [];
    this.showWinDelay = 1000;
    let emitdata = {
        roomid: this.id,
        roundname: "Deal",
        card: [],
        pot: "" + this.table.getRoundPot(),
        mainpots: this.mainPots,
    };
    this.io.in("r" + this.id).emit("TABLE_ROUND", emitdata);
};
TableManager.prototype.onSmallBlind = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
   // // console.log("onSmallBlind" + " roomID:" + this.id);
    try {
        this.totalPot += this.smallBlind;
        let message =
            player.playerName +
            " posted small blind with $" +
            ChangeUnit(this.smallBlind);

        let emitdata = {
            result: "sb",
            smallBlind: this.smallBlind,
            playerName: player.playerName,
            playerPosition: player.getIndex(),
            playerCards: player.cards,
            playerChips: player.chips,
            message: message,
        };
        this.io.sockets.in("r" + this.id).emit("SmallBlind_Deal", emitdata);

        this.maxRank_players = [];
        let players = this.table.players;
        let ranked_players = [];
        let ranks = [];
        for (let i = 0; i < players.length; i++) {
            if (players[i]) {
                const element = players[i];
                element.win = false;
                ranks.push(element._GetHand().rank);
                ranked_players.push({
                    player: element,
                    id: element.playerID,
                    rank: element._GetHand().rank,
                });
            }
        }
        let maxHandRank = Math.max.apply(null, ranks);
        this.maxRank_players = ranked_players.filter(
            (x) => x.rank == maxHandRank
        );
        this.maxRank_players.forEach((p) => {
            p.player.win = true;
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.onBigBlind = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("bigblind" + " roomID:" + this.id);
    try {
        this.totalPot += this.bigBlind;
        let message =
            player.playerName +
            " posted big blind with $" +
            ChangeUnit(this.bigBlind);
        let emitdata = {
            bigBlind: this.bigBlind,
            playerName: player.playerName,
            playerPosition: player.getIndex(),
            playerCards: player.cards,
            playerChips: player.chips,
            dealer: this.table.dealer,
            table: this.table,
            message: message,
        };
        this.io.sockets.in("r" + this.id).emit("BigBlind_Deal", emitdata);
        setTimeout(() => {
            this.table.NextPlayer();
        }, 500);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.onTurn = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("onTurn" + " roomID:" + this.id);
    try {
        setTimeout(() => {
            let emitdata = {
                roomid: this.id,
                name: player.playerName,
                position: player.getIndex(),
                chips: player.chips,
                timeBank: 3, //player.timebank,
                thoughtTime: 6,
                currentBet: player.GetBet(),
                maxBet: this.table.getMaxBet(),
                legalBet: this.legalBet,
                roundBet: player.GetRoundBet(),
                isFolded: player.folded,
                isAllIn: player.isAllIn,
                isSeated: player.isSeated,
                isEmptySeat: player.isEmptySeat,
                table: this.table,
            };
            this.io.sockets.in("r" + this.id).emit("turn", emitdata);
        }, 1000);
        this.turn = true;
        if (player.mode == "bot") {
            this.actionBot(player);
            return;
        }
        const thoughtTime = 6000;
        let timebank = 3 * 1000;
        let timeout = thoughtTime + timebank;

        this.currentTimeout = setTimeout(() => {
            player.foldCount++;
            if (player.GetBet() >= this.table.getMaxBet()) {
                this.check(player);
            } else {
                this.fold(player);
            }
            player.updateTimebank(0);
            this.removetimeout();
            if (player.foldCount == 2)
                this.standUp({
                    username: player.playerName,
                    userid: player.playerID,
                    isOffline: player.isOffline
                });
        }, timeout);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

TableManager.prototype.actionBot = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("actionBot" + " roomID:" + this.id);
    try {
        let goodcards = false;
        let botgoodcards = false;
        let card = "";
        let pSuit = "";
        for (let ind = 0; ind < player.cards.length; ind++) {
            card += player.cards[ind].charAt(0);
            pSuit += player.cards[ind].charAt(1);
        }

        let reverseCard = card.split("").reverse().join("");

        if (pocketCards.filter((x) => x == card).length > 0) {
            goodcards = true;
        } else if (pocketCards.filter((x) => x == reverseCard).length > 0) {
            goodcards = true;
        } else {
            for (let ind = 0; ind < this.table.board.length; ind++) {
                pSuit += this.table.board[ind].charAt(1);
            }

            if (
                (pSuit.match(new RegExp("S", "g")) || []).length == 5 ||
                (pSuit.match(new RegExp("C", "g")) || []).length == 5 ||
                (pSuit.match(new RegExp("D", "g")) || []).length == 5 ||
                (pSuit.match(new RegExp("H", "g")) || []).length == 5
            ) {
                goodcards = true;
            }
        }
        if (this.hardCount > 0) {
            goodcards = false;
            let winPlayers = this.table.checkWinners();

            let playerWinCount = 0;
            for (let i = 0; i < this.table.players.length; i++) {
                //gamelog.showlog(this.table.players[i] + " roomID:" + this.id);
                if (
                    this.table.players[i] != undefined &&
                    this.table.players[i].mode != "bot"
                ) {
                    if (winPlayers.includes(this.table.players[i].getIndex()))
                        playerWinCount++;
                }
            }
            if (playerWinCount == 0) botgoodcards = true;
            if (winPlayers.includes(player.getIndex())) {
                goodcards = true;
            }
            
        }
        
        setTimeout(() => {
            try {
                let info = {
                    action: "",
                    bet: 0,
                    legal_bet: 0,
                };
                let current_Bet = player.GetBet();
                let max_Bet = this.table.getMaxBet();
                let call = max_Bet - current_Bet;
                let canCheck,
                    canCall,
                    canRaise = true;
                let minRaise = 0;
                if (call == 0) minRaise = this.bigBlind;
                else if (call >= player.chips) {
                    call = player.chips;
                    canRaise = false;
                    canCall = true;
                } else {
                    if (current_Bet == 0) {
                        minRaise = call + this.legalBet;
                    } else {
                        if (call < this.bigBlind)
                            minRaise = call + this.bigBlind;
                        else minRaise = call + this.legalBet;
                    }
                }
                if (minRaise > player.chips) {
                    minRaise = player.chips;
                }
                if (current_Bet < max_Bet) canCall = true;
                else canCheck = true;
                if (this.hardCount > 0) {
                    if (canCheck) info.action = "check";
                    else if (canCall && goodcards) {
                        info.action = "call";
                        info.bet = call;
                    }
                    else if (canRaise && goodcards && botgoodcards) {
                        let randomNumber =
                            raiseRandom[
                            Math.floor(
                                Math.random() * raiseRandom.length
                            )
                            ];
                        info.legal_bet = this.legalBet;
                        info.bet = randomNumber * minRaise;
                        let maxBet = max_Bet;
                        let currentBet = current_Bet;
                        if (info.bet < player.chips) {
                            if (maxBet - currentBet == info.bet) {

                            } else {
                                let raiseNonce = Math.floor(Math.random() * 10) + 1;
                                if (raiseNonce > 6 && goodcards) {
                                    info.action = "raise";
                                    this.isRaise = true;
                                } else {
                                    info.action = "fold";
                                }
                            }
                            info.legal_bet = info.bet - call;
                        }
                    }
                    else if (this.isRaise) {
                        if (!goodcards) {
                            info.action = "fold";
                        } else {
                            info.action = "call";
                            info.bet = call;
                        }
                    }
                } else {
                    if (canCheck) info.action = "check";
                    let num1 = Math.floor(Math.random() * 10) + 1;
                    if (num1 > 4) {
                        if (canCall) {
                            info.action = "call";
                            info.bet = call;
                        } else { } //gamelog.showlog(">>> ERROR1".err + " roomID:" + this.id);
                    } else {
                        let randomNumber =
                            raiseRandom[
                            Math.floor(
                                Math.random() * raiseRandom.length
                            )
                            ];
                        let raiseNounce = Math.random() * 100;
                        if (canRaise && raiseNounce > 60) {
                            info.legal_bet = this.legalBet;
                            info.bet = randomNumber * minRaise;
                            let maxBet = max_Bet;
                            let currentBet = current_Bet;
                            if (info.bet < player.chips) {
                                if (maxBet - currentBet == info.bet) {
                                    info.action = "call";
                                } else {
                                    info.action = "raise";
                                    this.isRaise = true;
                                }
                                info.legal_bet = info.bet - call;
                            } else {
                                let buff = 0;
                                let index = 0;
                                for (
                                    let i = 0;
                                    i < this.table.players.length;
                                    i++
                                ) {
                                    //gamelog.showlog(this.table.players[i] + " roomID:" + this.id);
                                    if (
                                        this.table.players[i] !=
                                        undefined &&
                                        this.table.players[i].chips !=
                                        undefined &&
                                        buff <=
                                        this.table.players[i].chips
                                    ) {
                                        buff =
                                            this.table.players[i].chips;
                                        index = i;
                                    }
                                }
                                if (buff < player.chips) {
                                    if (
                                        this.table.game.bets.length > 0
                                    ) {
                                        info.bet =
                                            buff +
                                            this.table.game.bets[
                                            index
                                            ] -
                                            player.GetBet();
                                    } else {
                                        info.bet =
                                            buff - player.GetBet();
                                    }
                                } else {
                                    info.bet = player.chips;
                                }

                                info.action = "allin";
                            }
                        } else {
                            if (canCall && botgoodcards) {
                                info.action = "call";
                                info.bet = call;
                            } else { } //gamelog.showlog(">>> ERROR2".err + " roomID:" + this.id);
                        }
                    }
                }
                this.hardCount--;
                let message = player.playerName;
                this.removetimeout();
                player.updateTimebank(3);
                switch (info.action) {
                    case "call":
                        if (info.bet == player.chips) {
                            message +=
                                " called(allin) with $" +
                                ChangeUnit(player.chips);
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
                        player.bet(fixNumber(info.bet));
                        this.legalBet = fixNumber(info.legal_bet);
                        message +=
                            " raised with $" + ChangeUnit(fixNumber(info.bet));
                        this.isRaise = true;
                        break;
                    case "allin":
                        message +=
                            " bets(allin) with $" + ChangeUnit(player.chips);
                        player.allIn();
                        break;
                    case "fold":
                        player.fold();
                        message += " folded";
                        break;
                    default:
                        player.fold();
                        message += " folded";
                        info.action = "fold";
                        break;
                }

                let buff = this.totalPot;
                buff += fixNumber(info.bet);
                this.totalPot = buff;
                let emitdata = {
                    roomid: this.id,
                    name: player.playerID,
                    position: player.getIndex(),
                    action: info.action,
                    bet: info.bet,
                    chips: player.chips,
                    currentBet: player.GetBet(),
                    maxBet: this.table.getMaxBet(),
                    roundBet: player.GetRoundBet(),
                    roundPot: this.table.getRoundPot(),
                    totalPot: this.totalPot,
                    isFolded: player.folded,
                    isAllIn: player.isAllIn,
                    isSeated: player.isSeated,
                    isEmptySeat: player.isEmptySeat,
                    message: message,
                };
                this.io.sockets
                    .in("r" + this.id)
                    .emit("PLAYER_ACTION_RESULT", emitdata);
            } catch (error) {
                //gamelog.showlog(error + " roomID:" + this.id);
            }
        }, Math.floor(Math.random() * 1000) + 1000);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.onDealCards = function (boardCardCount, currnt_bets) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("onDealCards" + " roomID:" + this.id);
    try {
        let mainpots = this.roundMainPots(currnt_bets);
        this.mainPots = this.getMainPots(this.mainPots, mainpots);
        let emitdata = null;
        switch (this.table.game.roundName) {
            case "Flop":
                this.legalBet = 0;
                let board1 = this.table.game.board;
                let hands1 = [];
                for (let i = 0; i < this.table.players.length; i++) {
                    const element = this.table.players[i];
                    if (element && element.cards.length == 2) {
                        let _hand = {
                            id: i,
                            cards: element.cards,
                        };
                        hands1.push(_hand);
                    }
                }
                //gamelog.showlog("hands1" + " roomID:" + this.id);
                //gamelog.showlog(hands1 + "------------>" + "erererer:" + " roomID:" + this.id);
                let handStrengths1 = Ranker.orderHands(hands1, board1);
                emitdata = {
                    roomid: this.id,
                    roundname: "Flop",
                    card: this.table.game.board,
                    pot: "" + this.table.getRoundPot(),
                    mainpots: this.mainPots,
                    handStrengths: handStrengths1,
                };
                setTimeout(() => {
                    this.table.setCurrentPlayerToSmallBlind();
                }, 1000);
                break;
            case "Turn":
                this.legalBet = 0;
                let board2 = this.table.game.board;
                let hands2 = [];
                for (let i = 0; i < this.table.players.length; i++) {
                    const element = this.table.players[i];
                    if (element && element.cards.length == 2) {
                        let _hand = {
                            id: i,
                            cards: element.cards,
                        };
                        hands2.push(_hand);
                    }
                }

                let handStrengths2 = Ranker.orderHands(hands2, board2);
                emitdata = {
                    roomid: this.id,
                    roundname: "Turn",
                    card: this.table.game.board,
                    pot: "" + this.table.getRoundPot(),
                    mainpots: this.mainPots,
                    handStrengths: handStrengths2,
                };

                setTimeout(() => {
                    this.table.setCurrentPlayerToSmallBlind();
                }, 1000);
                break;
            case "River":
                this.legalBet = 0;
                let board3 = this.table.game.board;
                let hands3 = [];
                for (let i = 0; i < this.table.players.length; i++) {
                    const element = this.table.players[i];
                    if (element && element.cards.length == 2) {
                        let _hand = {
                            id: i,
                            cards: element.cards,
                        };
                        hands3.push(_hand);
                    }
                }
                let handStrengths3 = Ranker.orderHands(hands3, board3);
                emitdata = {
                    roomid: this.id,
                    roundname: "River",
                    card: this.table.game.board,
                    pot: "" + this.table.getRoundPot(),
                    mainpots: this.mainPots,
                    handStrengths: handStrengths3,
                };

                setTimeout(() => {
                    this.table.setCurrentPlayerToSmallBlind();
                });
                break;
            case "Showdown":
                if (this.table.game.board.length == 5) {
                    if (boardCardCount == 5) {
                        this.showWinDelay = 1500;
                    }
                    this.legalBet = 0;
                    let board3 = this.table.game.board;
                    let hands3 = [];
                    for (let i = 0; i < this.table.players.length; i++) {
                        const element = this.table.players[i];
                        if (element && element.cards.length == 2) {
                            let _hand = {
                                id: i,
                                cards: element.cards,
                            };
                            hands3.push(_hand);
                        }
                    }
                    let handStrengths3 = Ranker.orderHands(hands3, board3);
                    emitdata = {
                        roomid: this.id,
                        roundname: "Showdown",
                        card: this.table.game.board,
                        pot: "" + this.table.getRoundPot(),
                        mainpots: this.mainPots,
                        handStrengths: handStrengths3,
                    };
                    this.io.in("r" + this.id).emit("TABLE_ROUND", emitdata);
                }
                break;
        }
        if (emitdata != null) {
            if (emitdata.roundname != "Showdown") {
                setTimeout(() => {
                    if (!this.table.onlyoneplayerremaining()) {
                        this.io.in("r" + this.id).emit("TABLE_ROUND", emitdata);
                    }
                }, 500);
            }
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.onRoundShowdown = function (currnt_bets) {
    if (this.onlyBotsLive()) {
        return;
    }
    try {
        let _mainpots = this.roundMainPots(currnt_bets);
        this.mainPots = this.getMainPots(this.mainPots, _mainpots);
        let boardCards = [];
        if (this.table.game.board != undefined) {
            boardCards = this.table.game.board;
        }
        let emitdata = {
            roomid: this.id,
            roundname: "Showdown",
            card: boardCards,
            pot: "" + this.table.getRoundPot(),
            mainpots: this.mainpots,
        };
        this.io.in("r" + this.id).emit("TABLE_ROUND", emitdata);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.onWin = function (winner, prize) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("onWin" + " roomID:" + this.id);
    try {
        setTimeout(() => {
            let handrankVal = 0;
            if (!isNaN(winner.hand.rank)) {
                handrankVal = winner.hand.rank;
            }
            let board4 = this.table.game.board;
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
                        "(" +
                        playingcard[k]["suit"] +
                        ")" +
                        playingcard[k]["rank"] +
                        " ";
                    wining_cards.push(
                        playingcard[k]["rank"] + playingcard[k]["suit"]
                    );
                }
            }
            if (winner.hand.cards.length > 2) {
                let result = Ranker.getHand(winner.hand.cards);
                //gamelog.showlog(result.rankin + " roomID:" + this.idg)
                winner.hand.message = result.ranking;
            }
            let emitdata = {
                winner: winner.playerName,
                id: winner.playerID,
                position: winner.getIndex(),
                won: prize,
                handrank: winner.hand.message,
                wincards: winner.hand.cards,
                handrankvalue: handrankVal,
                handStrength: handStrengths4,
                message: message,
            };

            for (let k = 0; k < this.table.players.length; k++) {
                const player = this.table.players[k];
                if (
                    player &&
                    player.isEmptySeat == false &&
                    player.isSeated == true
                ) {
                    this.Update_level_handplayed(player.playerID);
                }
            }
            this.Update_recent_players();
            setTimeout(() => {
                this.Record_Won_History(
                    winner.playerID,
                    prize,
                    wining_hand,
                    wining_cards,
                    handrankVal
                );
            }, 100);
            this.io.in("r" + this.id).emit("TABLE_WIN", emitdata);
        }, this.showWinDelay);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.onGameOver = async function () {
    //gamelog.showlog("onGameOver" + " roomID:" + this.id);
    this.hardCount = 4;
    try {
        this.played++;
        this.totalPot = 0;
        if (this.onlyBotsLive()) {
            return;
        }
        //await this.addPlayers();
        else {
            this.io.in("r" + this.id).emit("JACKPOT_UPDATE", {
                royalFlash: this.table.royalFlash,
                royal4kinds: this.table.royal4kinds
            })
            await this.waitforSec(2000);
            await this.addPlayers();
            if (this.botCount > 0) {
                let tCount = this.botCount;
                // if (this.minBuyin > 400000000000 ) {
                //     tCount = 2;
                // } 
                let bookingPlayers = this.players.filter(
                    (p) => p.booking == true
                );
                let createCount =
                    tCount -
                    this.table.getIngamePlayersLength() -
                    bookingPlayers.length;
                let removeCount =
                    this.table.getIngamePlayersLength() +
                    bookingPlayers.length -
                    tCount;
                if (createCount > 0) {
                    // if (this.minBuyin <= 400000000000) {
                        await this.createBots(createCount);
                    // }
                } else if (removeCount > 0) await this.removeBots(removeCount);
            }
            await this.getStatus();
            await this.tableReposition();
            if (this.table.getIngamePlayersLength() > 1) {
                let time = 0;
                setTimeout(() => {
                    // let randomC = Math.floor(Math.random() * 3);
                    // if (randomC != 0) this.hardCount = 6;
                    // else this.hardCount = 0;
                    //}

                    this.isRaise = false;

                    this.table.initNewRound();
                }, time);
            } else {
                this.table.started = false;
                this.status = 0;
                this.table.game = undefined;
                for (let i = 0; i < this.table.players.length; i++) {
                    if (
                        this.table.players[i] &&
                        !this.table.players[i].isEmptySeat
                    ) {
                        let player = {
                            username: this.table.players[i].playerName,
                            userid: this.table.players[i].playerID,
                            balance: 0,
                            avatar: this.table.players[i].avatar,
                            photoUrl: this.table.players[i].photoUrl,
                            photoType: this.table.players[i].photoType,
                            seatnumber: i,
                            booking: false,
                            gift: "",
                            foldedCount: 0,
                            timebank: 3,
                            leaveenterflag: 0,
                            getCorrectSeatnumber: 1,
                            buyinflag: 1,
                            waitforbb: 1,
                            showcards: 0,
                            mode: "normal",
                            moveroom: 0,
                            isOffline: false
                        };
                        // for (let j = 0; j < this.players.length; j++) {
                        //   if (this.players[j].userid == player.userid) {
                        //     //  this.table.players.splice(i, 1);
                        //     return;
                        //   }
                        // }
                        //  this.table.players.splice(i, 1);
                        this.players.push(player);
                    }
                }
            }
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

TableManager.prototype.waitforSec = function (time) {
    if (this.onlyBotsLive()) {
        return;
    }
    if (this.onlyBotsLive()) {
        return;
    }
    return new Promise((resolve) => {
        setTimeout(() => {
            if (this.onlyBotsLive()) {
                return;
            }
            resolve();
        }, time);
    });
};

TableManager.prototype.onlyBotsLive = function () {

    try {
        let roomSockets = [];
        let roomID = this.id;
        if (this.io.nsps["/"].adapter.rooms["r" + roomID] != undefined) {
            for (let socketID in this.io.nsps["/"].adapter.rooms["r" + roomID].sockets) {
                let nickname = this.io.nsps["/"].connected[socketID].username;
                // let clientSocket = this.io.sockets.connected[socketID];
                roomSockets.push({
                    nickname: nickname,
                    // clientSocket: clientSocket,
                });
            }
        }

        if (roomSockets.length == 0) {
            for (let i = 0; i < this.table.players.length; i++) {
                if (this.table.players[i].isOffline) {
                    return false;
                }
            }
            for (let i = 0; i < this.waitingPlayers.length; i++) {
                if (this.waitingPlayers[i].isOffline) {
                    return false;
                }
            }
            if (this.players.length > 0) return false;
            return true;
        }
        else return false;
    } catch (error) {
        //// console.log(error + " roomID:" + this.id);
        return true;
    }
};
TableManager.prototype.onUpdatePlayer = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    this.io.in("r" + this.id).emit("UPDATE_PLAYER", {
        player: player,
    });
};
TableManager.prototype.onReturnChips = function (position, returnChips) {
    let emitdata = {
        position: position,
        chips: returnChips,
    };
    this.io.in("r" + this.id).emit("RETURN_CHIPS", emitdata);
};
TableManager.prototype.onBankrupt = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    try {
        this.io.in("r" + this.id).emit("Bankrupt", {
            player: player,
        });
        if (player.mode == "bot") {
            player.chips = this.minBuyin;
            player.isSeated = true;
            player.isEmptySeat = false;
        } else {
            //gamelog.showlog("bankrupt" + " roomID:" + this.id);
            this.check_points(player, this.minBuyin);
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.checkIndex = function (player, position) {
    let index = player.getIndex();
    if (index == position) return true;
    else return false;
};
TableManager.prototype.preaction = function (info) {
    let player = this.table.getPlayerByID(info.player_id);
    if (!player || player == undefined) return;
    player.preaction = info.action;
    player.prebet = info.bet;
}
TableManager.prototype.action = function (info) {
    if (this.onlyBotsLive()) {
        return;
    }
    try {
        let player = this.table.getPlayerByID(info.player_id);
        if (!player || player == undefined) return;
        if (
            player.table.currentPlayer != info.position &&
            this.checkIndex(player, info.position)
        )
            return;
        let message = player.playerName;
        this.removetimeout();
        //player.updateTimebank(parseInt(info.timebank));
        switch (info.action) {
            case "call":
                if (info.bet == player.chips) {
                    message +=
                        " called(allin) with $" + ChangeUnit(player.chips);
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
                player.bet(fixNumber(info.bet));
                this.legalBet = fixNumber(info.legal_bet);
                message += " raised with $" + ChangeUnit(fixNumber(info.bet));
                this.isRaise = true;
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

        let buff = this.totalPot;
        buff += fixNumber(info.bet);
        this.totalPot = buff;
        let emitdata = {
            roomid: this.id,
            name: info.player_id,
            position: info.position,
            action: info.action,
            bet: info.bet,
            chips: player.chips,
            currentBet: player.GetBet(),
            maxBet: this.table.getMaxBet(),
            roundBet: player.GetRoundBet(),
            roundPot: this.table.getRoundPot(),
            totalPot: this.totalPot,
            isFolded: player.folded,
            isAllIn: player.isAllIn,
            isSeated: player.isSeated,
            isEmptySeat: player.isEmptySeat,
            message: message,
        };
        this.io.sockets
            .in("r" + this.id)
            .emit("PLAYER_ACTION_RESULT", emitdata);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.fold = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    try {
        let message = player.playerName + " folded";
        if (!player || player === undefined) return;
        if (player.table.currentPlayer != player.getIndex()) return;
        this.removetimeout();
        if (player) {
            let emitdata = {
                roomid: this.id,
                name: player.playerID,
                position: player.getIndex(),
                action: "fold",
                bet: 0,
                chips: player.chips,
                currentBet: player.GetBet(),
                maxBet: this.table.getMaxBet(),
                roundBet: player.GetRoundBet(),
                roundPot: player.table.getRoundPot(),
                totalPot: this.totalPot,
                isFolded: player.folded,
                isAllIn: player.isAllIn,
                isSeated: player.isSeated,
                isEmptySeat: player.isEmptySeat,
                message: message,
            };
            this.io.sockets
                .in("r" + this.id)
                .emit("PLAYER_ACTION_RESULT", emitdata);
            player.fold();
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.check = function (player) {
    if (this.onlyBotsLive()) {
        return;
    }
    try {
        if (!player || player === undefined) return;
        if (player.table.currentPlayer != player.getIndex()) return;
        this.removetimeout();
        let message = player.playerName + " checked";
        if (player) {
            let emitdata = {
                roomid: this.id,
                name: player.playerID,
                position: player.getIndex(),
                action: "check",
                bet: 0,
                chips: player.chips,
                currentBet: player.GetBet(),
                maxBet: this.table.getMaxBet(),
                roundBet: player.GetRoundBet(),
                roundPot: this.table.getRoundPot(),
                totalPot: this.totalPot,
                isFolded: player.folded,
                isAllIn: player.isAllIn,
                isSeated: player.isSeated,
                isEmptySeat: player.isEmptySeat,
                message: message,
            };
            this.io.in("r" + this.id).emit("PLAYER_ACTION_RESULT", emitdata);
            player.Check();
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.removetimeout = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    this.turn = false;
    if (this.currentTimeout !== null) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
    }
};
TableManager.prototype.roundMainPots = function (bets) {
    if (this.onlyBotsLive()) {
        return;
    }
    try {
        let mainPots = [];
        while (this.checkbets(bets) > 0) {
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
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.percentIncrease = (partnumber, totalnumber) =>
    Math.ceil((partnumber / totalnumber) * 100);
TableManager.prototype.checkbets = function (bets) {
    let sum = 0;
    for (let index = 0; index < bets.length; index++) {
        const element = bets[index];
        sum += element;
    }
    return sum;
};
TableManager.prototype.getMainPots = function (tPots, mainPots) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("getMainPots" + " roomID:" + this.id);
    try {
        for (let i = 0; i < tPots.length; i++) {
            for (let j = 0; j < mainPots.length; j++) {
                let arr1 = tPots[i].seats;
                let arr2 = mainPots[j].seats;
                if (this.compareArray(arr1, arr2) == true) {
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
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.compareArray = function (arr1, arr2) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("comepareArray" + " roomID:" + this.id);
    try {
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
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.Update_recent_players = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    let roomid = this.id
    //gamelog.showlog("Update_recent_players" + " roomID:" + this.id);
    // if (this.onlyBotsLive()) {
    //     return;
    // }
    try {
        let realPlayers = this.table.players.filter(
            (player) =>
                player &&
                player.isEmptySeat == false &&
                player.isSeated == true &&
                player.mode != "bot"
        ); //
        if (realPlayers.length > 0) {
            let playerIds = [];
            for (let i = 0; i < realPlayers.length; i++) {
                playerIds.push(realPlayers[i].playerID);
            }
            for (let k = 0; k < realPlayers.length; k++) {
                const player = realPlayers[k];
                if (player.mode == "normal") {
                    let query = {
                        username: player.playerName,
                        userid: player.playerID,
                    };

                    this.collection_UserData.findOne(query, (err, result) => {
                        if (err) {} //gamelog.showlog("error12", err + " roomID:" + roomid);
                        else {
                            if (result != null) {
                                let newPlayerIds = playerIds.filter(
                                    (p) => p != player.playerID
                                );
                                let newRecents = newPlayerIds.concat(
                                    result.recents
                                );
                                let nnewRecents = [];
                                if (newRecents.length > 50) {
                                    for (
                                        let j = newRecents.length - 1;
                                        j >= newRecents.length - 50;
                                        j--
                                    ) {
                                        const element = newRecents[j];
                                        nnewRecents.push(element);
                                    }
                                } else nnewRecents = newRecents;
                                let result1 = [...new Set(nnewRecents)];
                                this.collection_UserData.updateOne(
                                    query,
                                    {
                                        $set: {
                                            recents: result1,
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
            }
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.Update_level_handplayed = function (userid) {
    if (this.onlyBotsLive()) {
        return;
    }
    let roomid = this.id
    //gamelog.showlog("Update_level_handplayed" + "roomID:" + this.id);
    // if (this.onlyBotsLive()) {
    //     return;
    // }
    try {
        let query = {
            userid: userid,
        };
        this.collection_UserData.findOne(query, (err, result) => {
            if (err) {} //gamelog.showlog("error12", err + " roomID:" + roomid);
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
                    let percent_won = this.percentIncrease(
                        result.hands_won,
                        hands_played
                    );
                    this.collection_UserData.updateOne(
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
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.Record_Won_History = function (
    winner,
    prize,
    wining_hand,
    wining_cards,
    handrankVal
) {
    if (this.onlyBotsLive()) {
        return;
    }
    let roomid = this.id;
    //gamelog.showlog("Record_Won_History" + " roomID:" + this.id);
    // if (this.onlyBotsLive()) {
    //     return;
    // }
    try {
        let query = {
            userid: winner,
        };
        let best_winning_hand = {
            cards: wining_cards,
            hand: wining_hand,
            handval: handrankVal,
        };
        this.collection_UserData.findOne(query, (err, result) => {
            if (err){} //gamelog.showlog("error2", err + " roomID:" + roomid);
            else {
                if (result != null) {
                    let hands_won = result.hands_won;
                    hands_won += 1;
                    let percent_won = this.percentIncrease(
                        hands_won,
                        result.hands_played
                    );
                    this.collection_UserData.updateOne(
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
                        this.collection_UserData.updateOne(
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
                        this.collection_UserData.updateOne(
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
                    let ind = null;
                    for (let i = 0; i < config.STAKES_SB.array.length; i++) {
                        const element = config.STAKES_SB.array[i];
                        if (this.smallBlind == element) {
                            ind = i;
                            break;
                        }
                    }
                    if (wining_hand.toLowerCase() == "royal flush") {
                        if (ind != null) {
                            this.collection_UserData.updateOne(
                                query,
                                {
                                    $set: {
                                        points:
                                            result.points +
                                            parseInt(
                                                this.table.royalFlash
                                            ),
                                    },
                                },
                                function (err) {
                                    if (err) throw err;
                                }
                            );
                            this.table.royalFlash = this.table.royalFlash / 10 * 3;
                            this.table.royal4kinds = this.table.royal4kinds / 10 * 3;
                            this.io.in("r" + this.id).emit("JACKPOT_UPDATE", {
                                royalFlash: this.table.royalFlash,
                                royal4kinds: this.table.royal4kinds
                            })
                        }
                    }
                    if (
                        wining_hand.toLowerCase() == "straight flush" ||
                        wining_hand.toLowerCase() == "four of a kind"
                    ) {
                        if (ind != null) {
                            this.collection_UserData.updateOne(
                                query,
                                {
                                    $set: {
                                        points:
                                            result.points +
                                            parseInt(
                                                this.table.royal4kinds
                                            ),
                                    },
                                },
                                function (err) {
                                    if (err) throw err;
                                }
                            );
                            this.table.royal4kinds = this.table.royal4kinds / 10 * 3;
                            this.table.royalFlash = this.table.royalFlash / 10 * 3;
                            this.io.in("r" + this.id).emit("JACKPOT_UPDATE", {
                                royalFlash: this.table.royalFlash,
                                royal4kinds: this.table.royal4kinds
                            })
                        }
                    }
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.addPlayers = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("addPlayers" + " roomID:" + this.id);
    try {
        return new Promise((resolve) => {
            let bookingPlayers = this.players.filter((p) => p.booking == true);
            if (bookingPlayers.length > 0) {
                let i = bookingPlayers.length;
                let checkroom = setInterval(() => {
                    if (i <= bookingPlayers.length && i > 0) {
                        i--;
                        let player = bookingPlayers[i];
                        this.table.addPlayer({
                            playerName: player.username,
                            playerID: player.userid,
                            chips: player.balance,
                            avatar: player.avatar,
                            photoUrl: player.photoUrl,
                            photoType: player.photoType,
                            mode: "normal",
                            position: player.seatnumber,
                            isOffline: player.isOffline
                        });
                        this.removeItem(this.players, player);
                    } else {
                        clearInterval(checkroom);
                        resolve();
                    }
                }, 100);
            } else resolve();
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.tableReposition = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("tableReposition" + " roomID:" + this.id);
    try {
        for (let i = 0; i < this.table.players.length; i++) {
            if (
                this.table.players[i] != undefined &&
                typeof this.table.players[i].folded != undefined &&
                this.table.players[i].folded != undefined
            ) {
                this.table.players[i].folded = false;
            }
        }
        return new Promise((resolve) => {
            let time = 30 * this.table.getIngamePlayersLength();
            let Reposition_time = time + 1500;
            setTimeout(() => {
                let emitdata = {
                    played: this.played,
                    level: this.level,
                    table: this.table,
                };
                this.io.in("r" + this.id).emit("TABLE_REPOSITION", emitdata);
                resolve();
            }, Reposition_time);
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.reJoinTable = function (socket, username, userid) {
    socket.room = "r" + this.id;
    socket.username = username;
    socket.userid = userid;
    socket.emit("CheckReconnectGame");
    socket.join("r" + this.id);
    this.getStatus();
    for (let i = 0; i < this.waitingPlayers.length; i++) {
        if (this.waitingPlayers[i].username == username && this.waitingPlayers[i].userid == userid) {
            this.waitingPlayers.splice(i, 1);
            break;
        }
    }
}
TableManager.prototype.enterTable = function (socket, username, userid) {
    // if(this.onlyBotsLive()) {
    //     return;
    // }
    //gamelog.showlog("enterTable" + " roomID:" + this.id, 1);
    try {
        let positions = [];
        let pos = 0;
        for (let i = 0; i < this.players.length; i++) {
            let element = this.players[i];
            positions.push(element.seatnumber);
        }
        while (true) {
            if (
                this.table.players[pos] === undefined ||
                (this.table.players[pos] &&
                    this.table.players[pos].playerName == "Empty seat")
            ) {
                let a = positions.filter((x) => x == pos);
                if (a.length == 0) {
                    break;
                } else pos++;
            } else {
                pos++;
            }
        }

        if (pos + 1 > this.maxPlayers) {
            let emData = {
                result: "failed",
                roomid: this.id,
                bigBlind: this.bigBlind,
                seated: false,
                seatnumber: pos,
            };
            socket.emit("REQ_ENTER_ROOM_RESULT", emData);
            return;
        }
        socket.room = "r" + this.id;
        socket.username = username;
        socket.userid = userid;

        socket.join("r" + this.id);
        let wCount = 0;
        for (let i = 0; i < this.waitingPlayers.length; i++) {
            if (this.waitingPlayers[i].userid == userid) {
                wCount++;
                break;
            }
        }
        if (wCount == 0)
            this.waitingPlayers.push({
                username: username,
                userid: userid,
                avatarUrl: "",
                chips: 0,
                photo_index: 0,
                photo_type: 0,
            });

        //this.waitingPlayers.push({ username: username, userid: userid, avatarUrl: "", chips: 0, photo_index: 0, photo_type: 0 });

        let emData = {
            result: "success",
            roomid: this.id,

            bigBlind: this.bigBlind,
            seated: false,
            seatnumber: pos,
        };

        socket.emit("REQ_ENTER_ROOM_RESULT", emData);

        let query = {
            userid: userid,
        };
        this.collection_UserData.updateOne(
            query,
            {
                $set: {
                    connected_room: this.id,
                },
            },
            function (err) {
                if (err) throw err;
            }
        );

        this.checkBotStatus(socket);
        //gamelog.showlog("enterTable:Status" + " roomID:" + this.id);
        this.getStatus();
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.checkBotStatus = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("checkBotStatus" + " roomID:" + this.id);
    try {
        if (this.botCount > 0) {
            if (this.status == 0) {
                // if (this.minBuyin <= 400000000000) {
                    this.createBots(this.botCount);
                // } else if (this.minBuyin > 400000000000) {
                    // this.createBots(2);
                // }
            }
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.AddChipsUser = function (userid, points) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("AddChipsuser" + " roomID:" + this.id);
    try {
        let player = this.table.players.find((p) => p && p.playerID == userid);
        if (player == null) return;

        player.chips += parseInt(points);
    } catch (error) {
        //g//amelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.MinusChipsUser = function (userid, points) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("MinusChipsUser" + " roomID:" + this.id);
    try {
        let player = this.table.players.find((p) => p && p.playerID == userid);
        if (player == null) return;
        player.chips -= parseInt(points);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.createBots = function (createCount) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("createBots" + " roomID:" + this.id);
    try {
        return new Promise((resolve) => {
            // let newnam = [];
            // let userNames = realNames;
            // while(userNames.length > createCount){
            //     let movenum = userNames.splice(Math.floor(Math.random() * userNames.length),1)[0]
            //     newnam.push(movenum);
            // }
            let count = 0;
            let interval = setInterval(() => {
                count++;
                if (count <= createCount) {
                    let userinfo = roommanager.getBotUrl(this.instance);
                    //let username = roommanager.getBotName(this.instance);
                    let username = userinfo.name;
                    let userphoto = userinfo.url;
                    let userid = this.getBotID();
                    //gamelog.showlog('--> Create Bot | ', username, userid + " roomID:" + this.id);
                    // create bot
                    this.table.addPlayer({
                        playerName: username,
                        playerID: userid,
                        chips: parseInt(this.minBuyin),
                        avatar: Math.floor(Math.random() * 119) + 1,
                        photoUrl: userphoto,
                        photoType: 0,
                        mode: "bot",
                        isOffline: false
                    });
                } else {
                    clearInterval(interval);
                    if (this.status == 0) {
                        this.status = 1;
                        this.table.startGame();
                    }
                    //gamelog.showlog("CreateBot:Status" + " roomID:" + this.id);
                    this.getStatus();
                    resolve();
                }
            }, 200);
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.removeBots = function (removeCount) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("removeBots" + " roomID:" + this.id);
    try {
        return new Promise((resolve) => {
            let count = 0;
            let interval = setInterval(() => {
                count++;
                if (count <= removeCount) {
                    let player = this.table.players.find(
                        (p) =>
                            p && p.mode == "bot" && p.playerName != "Empty seat"
                    );
                    //gamelog.showlog('--> Remove Bot | ', player.playerName, player.playerID + " roomID:" + this.id);
                    if (player) {
                        this.removeItem(this.botNames, player.playerName);
                        this.removeItem(this.botUrls, player.photoUrl);
                        this.removeItem(this.botIDs, player.playerID);
                        // remove bot
                        this.standUp_force(player, "remove");
                    }
                } else {
                    clearInterval(interval);
                    //gamelog.showlog("removeBots:Status" + " roomID:" + this.id);
                    this.getStatus();
                    resolve();
                }
            }, 700);
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.getBotID = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("getBotId" + " roomID:" + this.id);
    try {
        let _id = "";
        while (_id == "" || this.botIDs.indexOf(_id) != -1) {
            let randomnum3 = "" + Math.floor(10000 + Math.random() * 90000);
            let randomnum4 = "" + Math.floor(100000 + Math.random() * 900000);
            _id = randomnum3 + randomnum4;
        }
        this.botIDs.push(_id);
        return _id;
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

TableManager.prototype.getStatus = function (isStandUp = 0) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("getStatus" + " roomID:" + this.id);
    try {
        return new Promise((resolve) => {
            if (isStandUp == 0) {
                let emData = {
                    roomid: this.id,
                    seatlimit: this.table.maxPlayers,
                    gamemode: this.gameMode,
                    status: this.status,
                    totalPot: this.totalPot,
                    table: this.table,
                    played: this.played,
                    level: this.level,
                    playerlist: this.players,
                    isStandUp: isStandUp,
                };
                this.io.sockets
                    .in("r" + this.id)
                    .emit("CURRENT_ROOM_STATUS", emData);
            }

            setTimeout(() => {
                let emitData = {
                    result: this.players,
                    table: this.table,
                    isStandUp: isStandUp,
                };
                this.io.sockets
                    .in("r" + this.id)
                    .emit("TAKE_SEAT_PLAYERS", emitData);
                resolve();
            }, 100);
        });
    } catch (error) {
        //(error + " roomID:" + this.id);
    }
};

TableManager.prototype.sitDown = function (info, socket) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("sitDown" + " roomID:" + this.id);
    this.addPlayer(info, socket);
};
TableManager.prototype.networkOffline = function (info, socket) {
    let player = this.table.players.find(
        (p) =>
            p &&
            p.playerID == info.userid &&
            p.playerName == info.username
    );
    if (!player) {
        player = this.players.find(
            (p) =>
                p &&
                p.userid == info.userid &&
                p.username == info.username
        );
    }
    player.isOffline = true;
}
TableManager.prototype.standUp_forever = function (info, socket) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("standUp_forever" + " roomID:" + this.id);
    this.standUp(info, socket);
};
TableManager.prototype.standUp_force = function (player, bankrupt) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("standUp_force" + " roomID:" + this.id);
    this.standUp(
        {
            userid: player.playerID,
            username: player.playerName,
            mode: player.mode,
        },
        null,
        bankrupt
    );
};
TableManager.prototype.standUp = function (info, socket, bankrupt) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("standUp" + " roomID:" + this.id);
    try {
        if (info.mode != "bot") {
            let wCount = 0;
            for (let i = 0; i < this.waitingPlayers.length; i++) {
                if (this.waitingPlayers[i].userid == info.userid) {
                    wCount++;
                    break;
                }
            }
            if (wCount == 0)
                this.waitingPlayers.push({
                    username: info.username ? info.username : "",
                    userid: info.userid,
                    avatarUrl: "",
                    chips: 0,
                    photo_index: 0,
                    photo_type: 0,
                    isOffline: info.isOffline
                });
        }
        let position = -1;
        let player = this.players.find(
            (p) => p.userid == info.userid && p.username == info.username
        );
        if (player) {
            this.in_points(player.username, player.userid, player.balance);
            this.removeItem(this.players, player);
            for (let i = 0; i < this.waitingPlayers.length; i++) {
                if (this.waitingPlayers[i].userid == info.userid) {
                    this.waitingPlayers.splice(i, 1);
                }
            }
            // if (!socket) {

            // }
        } else {
            player = this.table.players.find(
                (p) =>
                    p &&
                    p.playerID == info.userid &&
                    p.playerName == info.username
            );

            if (player) {
                position = player.getIndex();
                if (this.table.started == true) {
                    if (this.table.currentPlayer == position) {
                        if (bankrupt == undefined){} //gamelog.showlog(">> fold" + " roomID:" + this.id);
                        if (bankrupt == undefined) this.fold(player);
                    }
                }
                this.in_points(info.username, info.userid, player.chips);
                this.table.RemovePlayer(info.userid);
                // for (let i = 0; i < this.waitingPlayers.length; i++) {
                //     if (this.waitingPlayers[i].userid == info.userid) {
                //         this.waitingPlayers.splice(i, 1);
                //     }
                // }
            } else {
               // gamelog.showlog("wrong standup > nothing user on the table".err + " roomID:" + this.id);
            }
        }
        if (socket) {
            if (info.action) {
                let emitdata = {
                    userid: info.userid,
                    position: position,
                    action: "leave",
                };
                //gamelog.showlog('leave emitData: ' ,emitdata + " roomID:" + this.id);
                this.io.sockets
                    .in("r" + this.id)
                    .emit("PLAYER_LEAVE_RESULT", emitdata);
            }
            if (socket.userid == info.userid) {
                //gamelog.showlog("Correct User Leaved!".success + " roomID:" + this.id);
                let query = {
                    userid: info.userid,
                };
                this.collection_UserData.updateOne(
                    query,
                    {
                        $set: {
                            connected_room: "",
                        },
                    },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
            socket.leave("r" + this.id);

            //// console.log("StandUp:Status1" + " roomID:" + this.id);
            try {
                if (socket) {
                    socket.leave("r" + this.id);
                }
            } catch (e) {
                // console.log(e + " roomID:" + this.id);
            }
            if (this.onlyBotsLive()) {
                return;
            }
            //gamelog.showlog("StandUp:Status1" + " roomID:" + this.id);

            // if (info.mode != "bot" && this.onlyBotsLive()) {
            //     return;
            // }
            // this.getStatus();
        }
        this.getStatus();
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

TableManager.prototype.addPlayer = function (info, socket) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("addPlayer" + " roomID:" + this.id);
    try {
        let username = info.player_name;
        let userid = info.player_id;
        let seat = fixNumber(info.position);
        let avatar = fixNumber(info.avatar);
        let photoUrl = info.photoUrl;
        let photoType = fixNumber(info.photoType);

        let player = {
            username: username,
            userid: userid,
            balance: 0,
            avatar: avatar,
            photoUrl: photoUrl,
            photoType: photoType,
            seatnumber: seat,
            booking: false,
            gift: "",
            foldedCount: 0,
            timebank: 3,
            leaveenterflag: 0,
            getCorrectSeatnumber: 1,
            buyinflag: 1,
            waitforbb: 1,
            showcards: 0,
            mode: "normal",
            moveroom: 0,
            isOffline: false
        };
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].userid == player.userid) {
                return;
            }
        }
        this.players.push(player);

        let emitData = {
            result: "success",
            username: username,
            userid: userid,
            avatar: avatar,
            seat: seat,
            photoUrl: photoUrl,
            photoType: photoType,
        };

        if (socket != null)
            this.io.sockets
                .in("r" + this.id)
                .emit("REQ_TAKE_SEAT_RESULT", emitData);
        // if (this.minBuyin > 400000000000 && this.players.length == 2) {
        this.table.startGame();
        // }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.WaitingPlayers = async function (info, socket) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("WaitingPlayers" + " roomID:" + this.id);
    try {
        await this.getWaitingData();
        //gamelog.showlog("WaitingPlayersValue");
        //gamelog.showlog(this.waitingPlayers);
        let emitData = {
            result: "success",
            players: this.waitingPlayers,
        };
        socket.emit("WAITING_PLAYERS", emitData);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.buyIn = function (info, socket) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("buyIn" + " roomID:" + this.id);
    try {
        let player = this.players.find(
            (player) =>
                player.userid == info.userid && player.username == info.username
        );
        if (player) {
            player.balance += fixNumber(info.buyin_money);
            this.out_points(info.username, info.userid, info.buyin_money);
            player.booking = true;
            //gamelog.showlog(info + " roomID:" + this.id);
            this.io.sockets.in("r" + this.id).emit("ADD_BALANCE", info);
            for (let i = 0; i < this.waitingPlayers.length; i++) {
                if (this.waitingPlayers[i].userid == info.userid) {
                    this.waitingPlayers.splice(i, 1);
                }
            }
            // this.checkTable();
            //gamelog.showlog('player.userid ?', player.useri + " roomID:" + this.idd)
            if (this.status == 0) {
                this.table.addPlayer({
                    playerName: player.username,
                    playerID: player.userid,
                    chips: player.balance,
                    avatar: player.avatar,
                    photoUrl: player.photoUrl,
                    photoType: player.photoType,
                    mode: "normal",
                    position: player.seatnumber,
                    isOffline: player.isOffline
                });
                this.removeItem(this.players, player);
                //let bookingPlayers = this.players.filter(p => p.booking);
                if (
                    this.table.getIngamePlayersLength() == this.table.minPlayers
                ) {
                    this.status = 1;
                    this.table.startGame();
                }
            } else {
            }
        } else {
            player = this.table.players.find(
                (player) =>
                    player &&
                    player.playerID === info.userid &&
                    player.playerName === info.username
            );
            if (player) {
                player.chips += fixNumber(info.buyin_money);
                out_points(info.username, info.userid, info.buyin_money);
                this.io.sockets.in("r" + this.id).emit("BUYIN_BALANCE", info);
            } else {
                //gamelog.showlog("wrong buyin > nothing user on the table".err + " roomID:" + this.id);
            }
        }
        //gamelog.showlog("BuyIn:Status" + " roomID:" + this.id);
        this.getStatus(2);
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

TableManager.prototype.removeItem = function (arr, value) {
    //gamelog.showlog("removeItem" + " roomID:" + this.id);
    try {
        var index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.in_points = function (username, userid, in_points) {
    if (this.onlyBotsLive()) {
        return;
    }
    let roomid = this.id
    //gamelog.showlog("in_points" + " roomID:" + this.id);
    // if (this.onlyBotsLive()) {
    //     return;
    // }
    try {
        //let collection = this.database.collection('User_Data');
        let query = { username: username, userid: userid };
        this.collection_UserData.findOne(query, (err, result) => {
            if (err) throw ("in_points:", err);
            else if (result) {
                let mypoints = result.points;
                mypoints = mypoints.toString().replace(/\,/g, "");
                //gamelog.showlog(mypoints + " roomID:" + roomid);
                in_points = in_points.toString().replace(/\,/g, "");
                //.showlog(in_points + " roomID:" + roomid);
                mypoints = fixNumber(mypoints) + fixNumber(in_points);
               // gamelog.showlog(mypoints + " roomID:" + roomid);
                if (fixNumber(mypoints) < 0) mypoints = 0;
                this.collection_UserData.updateOne(
                    query,
                    { $set: { points: fixNumber(mypoints) } },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.out_points = function (username, userid, out_points) {
    if (this.onlyBotsLive()) {
        return;
    }
    //// console.log("out_points" + " roomID:" + this.id);
    try {
        //let collection = this.database.collection('User_Data');
        let query = { username: username, userid: userid };
        this.collection_UserData.findOne(query, (err, result) => {
            if (err) throw ("out_points:", err);
            else if (result) {
                let mypoints = result.points;
                mypoints = mypoints.toString().replace(/\,/g, "");
                out_points = out_points.toString().replace(/\,/g, "");
                mypoints = fixNumber(mypoints) - fixNumber(out_points);
                if (fixNumber(mypoints) < 0) mypoints = 0;
                this.collection_UserData.updateOne(
                    query,
                    { $set: { points: fixNumber(mypoints) } },
                    function (err) {
                        if (err) throw err;
                    }
                );
            }
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.getWaitingData = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    let roomid = this.id
    //gamelog.showlog("getWaitingData" + " roomID:" + this.id);
    try {
        return new Promise((resolve) => {
            let wCount = 0,
                wLength = this.waitingPlayers.length;
            if (wLength == 0) resolve();
            //gamelog.showlog("waitingPlayers:" + this.id);
            //gamelog.showlog(this.waitingPlayers);
            for (let i = 0; i < this.waitingPlayers.length; i++) {
                let waitingPlayer = this.waitingPlayers[i];
                let query = {
                    username: waitingPlayer.username,
                    userid: waitingPlayer.userid,
                };
                this.collection_UserData.findOne(query, (err, result) => {
                    if (err) {
                        //gamelog.showlog(err + " roomID:" + roomid);
                    } else if (result) {
                        waitingPlayer.chips = result.points;
                        waitingPlayer.avatarUrl = result.photo;
                        waitingPlayer.photo_index = result.photo_index;
                        waitingPlayer.photo_type = result.photo_type;
                        wCount++;
                        if (wCount == wLength) {
                            resolve();
                        }
                    }
                });
            }
            resolve();
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.check_points = function (player, out_points) {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("check_points" + " roomID:" + this.id);
    try {
        let roomid = this.id;
        let roomTable = this;
        //gamelog.showlog("bankrupt3" + " roomID:" + roomid);
        //gamelog.showlog(player + " roomID:" + roomid);
        let query = { username: player.playerName, userid: player.playerID };
        //gamelog.showlog(query + " roomID:" + roomid);
        this.collection_UserData.findOne(query, (err, result) => {
            if (err) {
                //gamelog.showlog(err + " roomID:" + roomid);
                roomTable.standUp_force(player, "Bankrupt");
            } else if (result) {
                //gamelog.showlog("bankrupt1" + " roomID:" + roomid);
                let mypoints = result.points;
                mypoints = mypoints.toString().replace(/\,/g, "");
                out_points = out_points.toString().replace(/\,/g, "");
                if (fixNumber(mypoints) >= fixNumber(out_points)) {
                    mypoints = fixNumber(mypoints) - fixNumber(out_points);
                    if (fixNumber(mypoints) < 0) mypoints = 0;
                    roomTable.collection_UserData.updateOne(
                        query,
                        { $set: { points: fixNumber(mypoints) } },
                        function (err) {
                            if (err) {
                                //gamelog.showlog(err + " roomID:" + roomid);
                                roomTable.standUp_force(player, "Bankrupt");
                            } else {
                                player.chips = out_points;
                                player.isSeated = true;
                                player.isEmptySeat = false;
                                //gamelog.showlog("roomId:" + roomid + " roomID:" + roomid);
                                roomTable.io.sockets
                                    .in("r" + roomid)
                                    .emit("ADD_BALANCE", {
                                        room_id: roomid,
                                        username: player.playerName,
                                        userid: player.playerID,
                                        buyin_money: out_points,
                                    });
                            }
                        }
                    );
                } else {
                    //gamelog.showlog("bankrupt2" + " roomID:" + roomid);
                    roomTable.standUp_force(player, "Bankrupt");
                }
            }
        });
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

function fixNumber(str) {
    try {
        let newStr = str.toString().replace(/\,/g, "");
        let _fixnumber = Number(newStr);
        return _fixnumber;
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
}
var ChangeUnit = function (count) {
    try {
        let tokens = " KMBTqQsSondUDT";
        for (let i = 1; true; i += 1) {
            let val = Math.pow(1000, i);
            if (val > count) {
                return (count / Math.pow(1000, i - 1) + tokens[i - 1]).trim();
            }
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};
TableManager.prototype.getPlayerRander = function () {
    if (this.onlyBotsLive()) {
        return;
    }
    // console.log("getPlayerRander" + " roomID:" + this.id);
    try {
        let players = this.table.players;
        let ranked_players = [];
        let ranks = [];
        for (let i = 0; i < players.length; i++) {
            const element = players[i];

            ranks.push(element._GetHand().rank);
            ranked_players.push({
                name: element.playerName,
                rank: element._GetHand().rank,
            });
        }
        let maxHandRank = Math.max.apply(null, ranks);
        let maxRank_players = ranked_players.filter(
            (x) => x.rank == maxHandRank
        );
        for (let j = 0; j < bots.length; j++) {
            const _bot = bots[j];
            if (_bot.roomid == roomlist[index].roomid) {
                _bot.getGameResult(maxRank_players);
            }
        }
    } catch (error) {
        //gamelog.showlog(error + " roomID:" + this.id);
    }
};

var raiseRandom = [1, 2, 4];
var pocketCards = [
    "AA",
    "AK",
    "AQ",
    "AJ",
    "AT",
    "A9",
    "A8",
    "A7",
    "A6",
    "A5",
    "A4",
    "A3",
    "KA",
    "KK",
    "KQ",
    "KJ",
    "KT",
    "K9",
    "K8",
    "QA",
    "QK",
    "QQ",
    "QJ",
    "QT",
    "JA",
    "JK",
    "JQ",
    "TA",
    "TK",
    "9A",
    "8A",
    "7A",
    "6A",
    "5A",
    "4A",
    "3A",
    "9K",
    "8K",
    "TQ",
    "JJ",
    "TT",
    "99",
    "88",
    "77",
    "66",
    "55",
    "44",
    "33",
    "22",
];
module.exports = {
    TableManager: TableManager,
};
