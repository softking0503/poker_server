
'use strict';
var EventEmitter = require('events').EventEmitter;
var gamemanager = require('./gamemanager.js');
var botlog = require('./gamelog');
var raiseRandom = [1, 2, 4];
var pocketCards = ['AA', 'AK', 'AQ', 'AJ', 'AT', 'A9', 'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'KA', 'KK', 'KQ', 'KJ', 'KT', 'K9', 'K8', 'QA'
    , 'QK', 'QQ', 'QJ', 'QT', 'JA', 'JK', 'JQ', 'TA', 'TK', '9A', '8A', '7A', '6A', '5A', '4A', '3A', '9K', '8K', 'TQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
    '44', '33', '22'];
var bigBlinds = [10000000, 100000000, 1000000000, 5000000000, 10000000000, 20000000000];

function Bot(options) {
    this.userid = options.userid;
    this.username = options.username;
    this.chips = options.chips || 0;
    this.avatar = options.avatar;
    this.position = options.position;
    this.folded = false;
    this.isAllIn = false;
    this.talked = false;
    this.isSeated = true;
    this.isEmptySeat = false;
    this.cards = [];
    this.prize = 0;
    this.currenttimeout = null;
    this.win = false;
    this.winner_bot = false;
    this.round = "";
}

Bot.prototype.__proto__ = EventEmitter.prototype;

Bot.prototype.getGameResult = function (maxRank_players) {
    this.win = false;
    this.winner_bot = false;
    this.round = "Deal";
    let buff = maxRank_players.filter(max => max.name == this.playerName);
    if (buff.length > 0) {
        this.win = true;
    }
    else {
        for (let index = 0; index < maxRank_players.length; index++) {
            const element = maxRank_players[index];
            if (element.name.indexOf('Guest') != -1 && element.name.length == 12) {
                this.winner_bot = true;
                break;
            }
        }
    }
    // let num = Math.floor(Math.random() * 2) + 1;
    // if(num == 1) 
    // {
    //     if(this.win == false && this.winner_bot == false)
    //     {
    //         this.win = true;
    //     }               
    // }
}
Bot.prototype.tableRound = function (roundName) {
    this.round = roundName;
}

Bot.prototype.turn = function (index, bigBlind, legalbet, player) {
    //gamelog.showlog("bot's turn>>", index, bigBlind, legalbet, player.playerName);
    //gamelog.showlog(player.cards);
    let goodcards = false;
    let card = '';
    for (let ind = 0; ind < player.cards.length; ind++) {
        card += player.cards[ind].charAt(0);
    }
    let reverseCard = card.split('').reverse().join('');
    //gamelog.showlog(card, reverseCard);
    if (pocketCards.filter(x => x == card).length > 0) {
        goodcards = true; //gamelog.showlog("yeah");
    }
    else if (pocketCards.filter(x => x == reverseCard).length > 0) {
        goodcards = true;
    }
    this.currenttimeout = setTimeout(() => {
        let current_Bet = player.GetBet();
        let max_Bet = player.table.getMaxBet();
        let call = max_Bet - current_Bet;
        let canCheck, canCall, canRaise = true;
        let minRaise = 0;
        if (call == 0)
            minRaise = bigBlind;
        else if (call >= player.chips) {
            call = player.chips;
            canRaise = false;
            canCall = true;
        }
        else {
            if (current_Bet == 0) {
                minRaise = call + legalbet;
            }
            else {
                if (call < bigBlind)
                    minRaise = call + bigBlind;
                else
                    minRaise = call + legalbet;
            }
        }
        if (minRaise > player.chips) {
            minRaise = player.chips;
        }
        if (current_Bet < max_Bet)
            canCall = true;
        else
            canCheck = true;

        if (canCheck) gamemanager.Check(index, player.playerName);
        else {
            if(bigBlinds.indexOf(bigBlind) == -1)
            {
                if (goodcards == true)//if (this.win == true) // I can win
                {
                    let num1 = Math.floor(Math.random() * 2) + 1;
                    if (num1 == 1) {
                        if (canCall) gamemanager.Call(index, player.playerName, call);
                        else {} //gamelog.showlog(">>> error1");
                    }
                    else {
                        let randomNumber = raiseRandom[Math.floor(Math.random() * raiseRandom.length)];
                        if (canRaise) gamemanager.Raise(index, player.playerName, randomNumber * minRaise, max_Bet, current_Bet, call);
                        else {
                            if (canCall) gamemanager.Call(index, player.playerName, call);
                            else { } //gamelog.showlog(">>> error2");
                        }
                    }
                }
                else {
                    gamemanager.fold(index, player.playerName);
                    // if (this.winner_bot == true) // any bot will win in this table
                    // {
                    //     let randNum = (Math.floor(Math.random() * 10) + 1) * 6; // random number in 6 ~ 60
                    //     if (canCall && call <= randNum * bigBlind) {
                    //         gamemanager.Call(index, player.playerName, call);
                    //     }
                    //     else gamemanager.fold(index, player.playerName);
                    // }
                    // else {
                    //     if (canCall && current_Bet <= bigBlind && call <= bigBlind) gamemanager.Call(index, player.playerName, call);                        
                    //     //if (canCall && call == bigBlind && this.round == "Deal") gamemanager.Call(index, player.playerName, call);
                    //     else
                    //         gamemanager.fold(index, player.playerName);
                    // }
                }
            }
            else {
                if (this.win == true) // I can win
                {
                    let num1 = Math.floor(Math.random() * 2) + 1;
                    if (num1 == 1) {
                        if (canCall) gamemanager.Call(index, player.playerName, call);
                        else { } //gamelog.showlog(">>> error1");
                    }
                    else {
                        let randomNumber = raiseRandom[Math.floor(Math.random() * raiseRandom.length)];
                        if (canRaise) gamemanager.Raise(index, player.playerName, randomNumber * minRaise, max_Bet, current_Bet, call);
                        else {
                            if (canCall) gamemanager.Call(index, player.playerName, call);
                            else { } //gamelog.showlog(">>> error2");
                        }
                    }
                }
                else {
                    // gamemanager.fold(index, player.playerName);
                    if (this.winner_bot == true) // any bot will win in this table
                    {
                        let randNum = (Math.floor(Math.random() * 10) + 1) * 6; // random number in 6 ~ 60
                        if (canCall && call <= randNum * bigBlind) {
                            gamemanager.Call(index, player.playerName, call);
                        }
                        else gamemanager.fold(index, player.playerName);
                    }
                    else {
                        //if (canCall && current_Bet <= bigBlind && call <= bigBlind) gamemanager.Call(index, player.playerName, call);                        
                        //if (canCall && call == bigBlind && this.round == "Deal") gamemanager.Call(index, player.playerName, call);
                       // else
                            gamemanager.fold(index, player.playerName);
                    }
                }
            }
        }
        setTimeout(() => {
            clearTimeout(this.currenttimeout);
            this.currenttimeout = null;
        }, 10);
    }, Math.floor(Math.random() * 1000) + 1000
    );
}

module.exports = {
    Bot: Bot
};