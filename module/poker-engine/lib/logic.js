'use strict';

var Table = require('./table').Table;
var Player = require('./player').Player;

Table.prototype.getPlayerByID = function(playerID) {
    var found = false;
    var i = 0;

    while (i < this.players.length && !found) {
        if(!this.players[i]) i++;
        else if(this.players[i].playerID !== playerID) {
            i++;
        } else {
            found = true;
        }
    }
    return this.players[i];
};


Table.prototype.toJSON = function() {

    var table = {
        smallBlind: this.smallBlind,
        bigBlind  : this.bigBlind,
        minPlayers: this.minPlayers,
        maxPlayers: this.maxPlayers,
        players   : [],
        dealer    : this.dealer,
        dPos      : this.dPos,
        started   : this.started,
        game      : this.game || {}
    };

    if(typeof this.currentPlayer !== 'undefined') {
        table.currentPlayer = this.currentPlayer;
    }

    var getPlayers = function(list) {
        var result = [];

        if(list) {
            for (var i = 0; i < list.length; i++) {
                var player = list[i];

                // if(player && player.isEmptySeat) {
                //     result.push({
                //         playerName: player.playerName
                //     });
                // } else if(player && !player.isEmptySeat) {
                    if(player && player.playerName != "Empty seat"){
                    result.push({
                        playerName: player.playerName,
                        playerID  : player.playerID,
                        chips     : player.chips,
                        folded    : player.folded,
                        isAllIn   : player.isAllIn,
                        talked    : player.talked,
                        isSeated  : player.isSeated,
                        isEmptySeat : player.isEmptySeat,
                        cards     : player.cards || [],
                        prize     : player.prize,
                        position  : player.getIndex(),
                        avatar    : player.avatar,
                        photoUrl  : player.photoUrl,
                        photoType : player.photoType,
                        timebank  : player.timebank,
                        missBlind : player.missBlind,
                        gift      : player.gift
                    });
                }

            }
        }
        return result;
    };

    table.players = getPlayers(this.players);

    return table;
};

/**
 * UTILS
 */
var getMinPlayers = function(players) {
    var tot = 0;

    if (players === undefined) {
        return 0;
    }

    players.forEach(function() {
        tot++;
    });

    return tot;
};

/**
 * get new game
 */
var newTable = function(params, players) {
    var table;

    // create game
    // Table params : smallBlind, bigBlind, minPlayers, maxPlayers
    // add players

    var minPlayers = getMinPlayers(players);
    minPlayers = 2;
    // TODO make a tournament mode
    table = new Table(params.minBlind,
        params.maxBlind,
        minPlayers,
        params.maxPlayers,
        params.royalFlash,
        params.royal4kinds);

    // add players
    if (players !== undefined) {
        players.forEach(function(player, $index) {
            table.addPlayer({
                playerName: player.playerName,
                playerID  : player.playerID,
                chips     : player.chips || 100,
                position  : $index
            });
        });
    }
    

    return table;
};

var tableParseInt = function(table, base) {
    for (var i = 0; i < table.length; i++) {
        table[i] = parseInt(table[i], base || 10) || 0;
    }
    return table;
};

/**
 * import full game
 */
var load = function(data) {

    // create game
    // Table params : smallBlind, bigBlind, minPlayers, maxPlayers
    var smallBlind = parseInt(data.smallBlind, 10),
        bigBlind = parseInt(data.bigBlind, 10),
        minPlayers = parseInt(data.minPlayers, 10),
        maxPlayers = parseInt(data.maxPlayers, 10);

    // create new game
    var table = new Table(smallBlind, bigBlind, minPlayers, maxPlayers);

    var restorePlayer = function(playersData, table) {
        var player = new Player({
            playerName: playersData.playerName,
            playerID: playersData.playerID,
            chips     : parseInt(playersData.chips, 10),
            table     : table
        });

        player.folded = playersData.folded;
        player.isAllIn = playersData.isAllIn;
        player.talked = playersData.talked;
        player.isSeated = playersData.isSeated;
        player.cards = playersData.cards;

        return player;
    };

    // add players
    if(data.players) {
        for (var i = 0; i < data.players.length; i++) {
            var playersData = data.players[i];
            if(playersData) {
                table.players.push(restorePlayer(playersData, table));
            }
        }
    }

    // restore current player
    table.currentPlayer = parseInt(data.currentPlayer, 10);

    // set dealer
    table.dealer = parseInt(data.dealer, 10);

    // restore game
    table.game = data.game || {};
    table.game.board = table.game.board || [];
    table.game.bets = table.game.bets || [];
    table.game.roundBets = table.game.roundBets || [];

    // parse int
    table.game.smallBlind = parseInt(table.game.smallBlind, 10) || 0;
    table.game.bigBlind = parseInt(table.game.bigBlind, 10) || 0;
    table.game.pot = parseInt(table.game.pot, 10) || 0;
    table.game.bets = tableParseInt(table.game.bets);
    table.game.roundBets = tableParseInt(table.game.roundBets);

    return table;
};


module.exports.newTable = newTable;
module.exports.import = load;
