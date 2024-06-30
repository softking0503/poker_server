"use strict";

var Player = require("./player.js").Player;
var Game = require("./game.js").Game;
var utils = require("./utils.js");
var EventEmitter = require("events").EventEmitter;
var colors = require("colors");
var Ranker = require("../../handranker");
colors.setTheme({
	info: "bgGreen",
	help: "cyan",
	warn: "yellow",
	success: "bgBlue",
	error: "red",
});
var thoughtTime = 25000;

function Table(smallBlind, bigBlind, minPlayers, maxPlayers, royalFlash, royal4kinds) {
	this.smallBlind = smallBlind;
	this.bigBlind = bigBlind;
	this.royalFlash = royalFlash;
	this.royal4kinds = royal4kinds;
	this.minPlayers = minPlayers;
	this.maxPlayers = maxPlayers;
	this.players = [];
	this.currentPlayer = 0;
	this.started = false;
	this.dealer = 0; //Track the dealer position between games
	this.gameoverd = false;
	this.turnTimeout = null;
	this.board = [];
	this.board1 = [];
	this.bets = [];
	this.decideWinner = false;

	//Validate acceptable value ranges.
	let err;
	if (minPlayers < 2) {
		//require at least two players to start a game.
		err = new Error(
			101,
			"Parameter [minPlayers] must be a postive integer of a minimum value of 2."
		);
	} else if (maxPlayers > 9) {
		//hard limit of 10 players at a table.
		err = new Error(
			102,
			"Parameter [maxPlayers] must be a positive integer less than or equal to 10."
		);
	} else if (minPlayers > maxPlayers) {
		//Without this we can never start a game!
		err = new Error(
			103,
			"Parameter [minPlayers] must be less than or equal to [maxPlayers]."
		);
	}

	if (err) {
		return err;
	}
}

// inherit from Event emitter
Table.prototype.__proto__ = EventEmitter.prototype;

Table.prototype.fillDeck = function () {
	let deck = [
		"AS",
		"KS",
		"QS",
		"JS",
		"TS",
		"9S",
		"8S",
		"7S",
		"6S",
		"5S",
		"4S",
		"3S",
		"2S",
		"AH",
		"KH",
		"QH",
		"JH",
		"TH",
		"9H",
		"8H",
		"7H",
		"6H",
		"5H",
		"4H",
		"3H",
		"2H",
		"AD",
		"KD",
		"QD",
		"JD",
		"TD",
		"9D",
		"8D",
		"7D",
		"6D",
		"5D",
		"4D",
		"3D",
		"2D",
		"AC",
		"KC",
		"QC",
		"JC",
		"TC",
		"9C",
		"8C",
		"7C",
		"6C",
		"5C",
		"4C",
		"3C",
		"2C",
	];

	return this.shuffle(deck);
};

Table.prototype.shuffle = function (deck) {
	//Shuffle the deck array with Fisher-Yates
	let i, j, tempi, tempj;

	for (i = 0; i < deck.length; i++) {
		j = Math.floor(Math.random() * (i + 1));
		tempi = deck[i];
		tempj = deck[j];
		deck[i] = tempj;
		deck[j] = tempi;
	}

	return deck;
};

Table.prototype.getMaxBet = function () {
	let bets = this.game.bets;
	let maxBet = 0;

	for (let i = 0; i < bets.length; i++) {
		if (bets[i] > maxBet) {
			maxBet = bets[i];
		}
	}
	return maxBet;
};
Table.prototype.getRoundPot = function () {
	let roundpot = 0;
	for (let index = 0; index < this.game.roundBets.length; index++) {
		const element = this.game.roundBets[index];
		roundpot += element;
	}
	return roundpot || 0;
};
Table.prototype.onlyoneplayerremaining = function () {
	let remainingplayer = 0;

	this.forEachPlayers(function (player) {
		if (!player.folded && player.playerName != "Empty seat") {
			remainingplayer++;
		}
	});
	if (remainingplayer == 1) return true;
	else return false;
};
Table.prototype.allInGamePlayersAreAllIn = function () {
	let all = true;

	this.forEachPlayers(function (player) {
		if (
			!player.isAllIn &&
			!player.folded &&
			player.playerName != "Empty seat"
		) {
			all = false;
		}
	});

	return all;
};

Table.prototype.allPlayersTalked = function () {
	let endOfRound = true;

	for (let index = 0; index < this.players.length; index++) {
		let player = this.players[index];
		if (player && player.playerName !== "Empty seat") {
			if (
				!player.isEmptySeat &&
				!player.talked &&
				!player.folded &&
				!player.isAllIn
			) {
				endOfRound = false;
				break;
			}
		}
	}

	return endOfRound;
};

Table.prototype.getAllInWinners = function (winners) {
	let allInPlayer = [];

	for (let i = 0; i < winners.length; i++) {
		let winner = winners[i];

		if (this.players[winner].isAllIn) {
			allInPlayer.push(winner);
		}
	}
	return allInPlayer;
};

Table.prototype.GetWinnersIndexes = function (isOnePlayer) {
	let winners = [];

	let maxRank = 0.0;
	if (isOnePlayer == false) {
		for (let i = 0; i < this.players.length; i++) {
			if (
				this.players[i] &&
				!this.players[i].isEmptySeat &&
				!this.players[i].folded
			) {

				if (maxRank < this.players[i].hand.rank)
					maxRank = this.players[i].hand.rank;
			}
		}
	}
	this.forEachPlayers(function (player, $index) {

		let playerRank = player.hand.rank;

		if (!player.folded) {
			if (isOnePlayer) winners = [$index];
			else {
				if (playerRank === maxRank) {
					winners.push([$index]);
				}
				// if (playerRank > maxRank) {
				//     maxRank = playerRank;
				//     winners = player.getIndex();
				// }
			}
		}
	});

	return winners;
};

Table.prototype.getMinBets = function (allInPlayer, winners) {
	let minBets = this.game.roundBets[winners[0]];

	for (let j = 1; j < allInPlayer.length; j++) {
		let roundBet = this.game.roundBets[winners[j]];
		if (roundBet !== 0 && roundBet < minBets) {
			minBets = roundBet;
		}
	}

	return minBets;
};

Table.prototype.makePrize = function (part) {
	let roundBet = null;
	let prize = 0;

	for (let l = 0; l < this.game.roundBets.length; l++) {
		roundBet = this.game.roundBets[l];
		if (roundBet > part) {
			prize = prize + part;
			this.game.roundBets[l] = this.game.roundBets[l] - part;
		} else {
			prize = prize + roundBet;
			this.game.roundBets[l] = 0;
		}
	}

	return prize;
};

Table.prototype.GivePrize = function (winners, prize) {
	prize = prize * 0.95;
	this.royalFlash = Math.ceil(this.royalFlash + prize * 0.04)
	this.royal4kinds = Math.ceil(this.royal4kinds + prize * 0.01)
	let won = Math.ceil(prize / winners.length);
	//if(this.decideWinner == false) won = this.roundNum(Math.ceil(won * 0.9));
	for (let i = 0; i < winners.length; i++) {
		let winner = this.players[winners[i]];
		winner.prize = winner.prize + won;
		winner.chips = winner.chips + won;

		if (this.game.roundBets[winners[i]] === 0) {
			winner.folded = true;
		}

		if (this.decideWinner == false) this.emit("win", winner, won);
	}
	if (this.decideWinner == false) this.decideWinner = true;
};
Table.prototype.checkWinners = function () {
	//this.board.pop();

	//let board = this.game.board;
	let board = this.board1;

	let hands1 = [];
	for (let i = 0; i < this.players.length; i++) {
		const element = this.players[i];
		if (
			element &&
			!element.isEmptySeat &&
			!element.folded &&
			element.cards.length == 2
		) {
			let _hand = {
				id: i,
				cards: element.cards,
			};
			hands1.push(_hand);
		}
	}
	let wins = [];
	if (board.length > 0 && hands1.length > 0) {
		let results = Ranker.orderHands(hands1, board);
		results[0].forEach((item) => {
			wins.push(item.id);

		});
	}

	return wins;
};
Table.prototype.roundEnd = function () {
	let roundEnd = true;
	let i = 0;

	while (roundEnd && i < this.game.roundBets.length) {
		if (this.game.roundBets[i] !== 0) {
			roundEnd = false;
		}
		i++;
	}

	return roundEnd;
};

Table.prototype.checkForWinner = function (isOnePlayer) {
	while (!this.roundEnd()) {
		let part = 0;

		//Identify winner(s)
		let winners = this.GetWinnersIndexes(isOnePlayer);

		let allInPlayer = this.getAllInWinners(winners);

		if (allInPlayer.length > 0) {
			part = parseInt(this.getMinBets(allInPlayer, winners), 10);
		} else {
			part = parseInt(this.game.roundBets[winners[0]], 10);
		}

		let prize = this.makePrize(part);


		// let totalbets = 0;
		// for (let i = 0; i < this.bets.length; i++) {

		//     totalbets += this.bets[i];
		// }
		// let winnerbets = 0;
		// let arrayWinnerbets = [];
		// for (let i = 0; i < winners.length; i++) {
		//     winnerbets += this.bets[winners[i]];
		//     arrayWinnerbets.push(this.bets[winners[i]]);
		// }
		// let maxWinnerBet = Math.max.apply(null, arrayWinnerbets);
		// for (let i = 0; i < this.players.length; i++) {
		//     const player = this.players[i];
		//     if(player && !player.isEmptySeat && !player.folded)
		//     {
		//         if(this.bets[i] > maxWinnerBet){

		//             player.chips = player.chips + (this.bets[i] - maxWinnerBet);
		//         }
		//     }
		// }


		// let won = Math.ceil(prize / winners.length);
		// won = this.roundNum(Math.ceil(won * 0.9));

		// this.GivePrize(winners, won);
		this.GivePrize(winners, prize);
	}

	setTimeout(() => {
		this.checkForBankrupt();
	}, 3000);
};

Table.prototype.checkForBankrupt = function () {
	for (let i = this.players.length - 1; i >= 0; i--) {
		if (this.players[i] && this.players[i].chips < this.bigBlind) {
			if (this.players[i].chips <= 0) this.players[i].chips = 0;
			if (
				this.players[i] &&
				!this.players[i].isEmptySeat &&
				this.players[i].playerName !== "Empty seat"
			) {
				this.players[i].isEmptySeat = true;
				this.players[i].isSeated = false;
				this.emit("Bankrupt", this.getPlayerByID(this.players[i].playerID));
			}
		}
	}
	let self = this;
	for (let i = 0; i < this.players.length; i++) {
		if (this.players[i] && this.players[i].cards != undefined) {
			this.players[i].cards = [];
		}
	}
	setImmediate(function () {
		self.emit("gameOver");
		this.gameoverd = true;
	});
};

Table.prototype.forEachPlayers = function (fn) {
	for (let i = 0; i < this.players.length; i++) {
		if (this.players[i] && !this.players[i].isEmptySeat) {
			fn(this.players[i], i);
		}
	}
};
Table.prototype.initPlayers = function () {
	this.players = [];
};

Table.prototype.moveBetsToPot = function () {
	let bets = [];
	for (let i = 0; i < this.game.bets.length; i++) {
		let bet = parseInt(this.game.bets[i], 10);
		this.game.pot = this.game.pot + bet;
		this.game.roundBets = utils.protectArrayBet(this.game.roundBets, i, bet);
		bets.push(this.game.bets[i]);
		this.game.bets[i] = 0;
	}
	return bets;
};
Table.prototype.dealCards = function (total, bets) {
	for (let i = 0; i < total; i++) {
		this.game.board.push(this.board.pop()); //Turn a card
	}

	this.emit("dealCards", total, bets);
};

Table.prototype.resetTalkedState = function () {
	this.forEachPlayers(function (player) {
		player.talked = false;
	});
};

Table.prototype.setCurrentPlayerToSmallBlind = function () {
	this.currentPlayer = this.dealer;
	this.NextPlayer();
};

Table.prototype.setStep = function (step, bets) {
	// if (this.bets.length == 0) {
	//     for (let index = 0; index < bets.length; index++) {
	//         this.bets.push(0);
	//     }
	// }
	// for (let index = 0; index < bets.length; index++) {
	//     const element = bets[index];
	//     this.bets[index] += element;
	// }
	switch (step) {
		case "deal":
			this.game.roundName = "Deal";
			this.emit("roundDeal");
			// this.bets = [];
			break;
		case "flop":
			if (this.game.roundName === "flop") {
				this.game.bets[x] += 1;
			}
			this.game.roundName = "Flop";
			this.emit("roundFlop");
			this.resetTalkedState();
			this.dealCards(3, bets);
			break;

		case "turn":
			this.game.roundName = "Turn";
			this.emit("roundTurn");
			this.resetTalkedState();
			this.dealCards(1, bets);
			break;

		case "river":
			this.game.roundName = "River";
			this.emit("roundRiver");

			this.resetTalkedState();
			this.dealCards(1, bets);
			break;

		case "showdown":
			setTimeout(() => {
				this.game.roundName = "Showdown";
				this.decideWinner = false;
				if (this.onlyoneplayerremaining()) {
					this.emit("roundShowdown", bets);
				} else {
					let missingCards = 5 - this.game.board.length;
					if (missingCards == 0) {
						this.emit("roundShowdown", bets);
					} else {
						this.dealCards(missingCards, bets);
					}
				}

				this.game.bets = [];

				//Evaluate each hand
				this.forEachPlayers(function (player) {
					player.SetHand();
				});

				this.checkForWinner(this.onlyoneplayerremaining());
			}, 100);
			break;
	}
};

Table.prototype.progress = function () {
	setTimeout(() => {
		if (
			this.allPlayersTalked() ||
			this.onlyoneplayerremaining() ||
			this.lastoneplayerbetallin()
		) {
			if (
				this.allInGamePlayersAreAllIn() ||
				this.game.roundName === "River" ||
				this.onlyoneplayerremaining() ||
				this.lastoneplayerbetallin()
			) {
				let bets = this.moveBetsToPot();
				this.setStep("showdown", bets);
			} else if (this.game.roundName === "Turn") {
				let bets = this.moveBetsToPot();
				this.setStep("river", bets);
			} else if (this.game.roundName === "Flop") {
				let bets = this.moveBetsToPot();
				this.setStep("turn", bets);
			} else if (this.game.roundName === "Deal") {
				let bets = this.moveBetsToPot();
				this.setStep("flop", bets);
			}
		} else {
			this.NextPlayer();
		}
	}, 200);
};
Table.prototype.lastoneplayerbetallin = function () {
	let remainingplayer = 0;
	let lastplayerindex;
	this.forEachPlayers(function (player, $index) {
		if (!player.folded && !player.isAllIn) {
			remainingplayer++;
			lastplayerindex = $index;
		}
	});
	if (remainingplayer === 1) {
		if (this.players[lastplayerindex].GetBet() >= this.getMaxBet()) return true;
		else return false;
	} else return false;
};
Table.prototype.getNextPlayerIndex = function (current_Index) {
	//Table.prototype.getNextPlayerIndex = function (current_Index, findTalker) {
	let found = false;
	let currentIndex = current_Index;

	while (!found) {
		currentIndex++;
		currentIndex = currentIndex < this.players.length ? currentIndex : 0;
		if (this.players[currentIndex] != undefined)
			if (this.players[currentIndex].playerName != "Empty seat") {
				if (
					!this.players[currentIndex].isEmptySeat ||
					(!this.players[currentIndex].isEmptySeat &&
						!this.players[currentIndex].talked)
				) {
					if (
						!this.players[currentIndex].folded &&
						!this.players[currentIndex].isAllIn
					) {
						found = true;
					}
				}
			}
	}

	return currentIndex;
};

Table.prototype.getSimulationNextPlayerIndex = function (current_Index) {
	let found = false;
	let currentIndex = current_Index;

	while (!found) {
		currentIndex++;
		currentIndex = currentIndex < this.players.length ? currentIndex : 0;
		if (this.players[currentIndex].playerName != "Empty seat") {
			if (!this.players[currentIndex].isEmptySeat) {
				found = true;
			}
		}
	}

	return currentIndex;
};

Table.prototype.initNewRound = function () {

	if (this.players.length == 1) {
		this.started = false;
		return;
	}
	let seatedPlayerCount = 0;
	for (let i = 0; i < this.players.length; i++) {
		if (this.players[i] && this.players[i].isSeated != undefined) {
			seatedPlayerCount++;
		}
	}
	if (seatedPlayerCount <= 1) {
		this.started = false;
		return;
	}

	this.gameoverd = false;
	for (let i = 0; i < this.players.length; i++) {
		let player = this.players[i];
		if (player != undefined) {
			player.folded = false;
			player.talked = false;
			player.isAllIn = false;
			player.cards = [];
			player.prize = 0;
			player.isEmptySeat = !player.isSeated;
			if (player.isSeated) player.isEmptySeat = false;
			player.timebank += 2;
			if (player.timebank > 10) {
				player.timebank = 10;
			}
		}
	}
	let seatedPlayers = this.players.filter((x) => !x.isEmptySeat);
	if (seatedPlayers.length == 1) {
		this.started = false;
		return;
	}
	this.started = true;
	this.dealer = this.getNextPlayerIndex(this.dealer);
	if (this.game == undefined) {
		this.game = new Game(this.smallBlind, this.bigBlind);
	}
	this.game.pot = 0;
	this.setStep("deal", []);

	this.game.betName = "bet"; //bet,raise,re-raise,cap
	this.game.bets = [];
	this.game.board = [];

	this.game.deck = this.fillDeck();
	this.emit("deckReady", this.game.deck);
	this.NewRound();
};
Table.prototype.checkRestart = function (player) {
	if (!this.started) {
		this.started = true;
		this.initNewRound();
	}
};
Table.prototype.GetPlayersIndexes = function () {
	let table = [];
	this.forEachPlayers(function (player, $index) {
		table.push($index);
	});
	return table;
};

Table.prototype.GetFirstDealer = function () {
	return 0;
};

Table.prototype.startGame = function () {
	if (this.started) {
		// console.log("already started ...");
	} else if (
		!this.game &&
		this.getIngamePlayersLength() >= this.minPlayers &&
		this.getIngamePlayersLength() <= this.maxPlayers
	) {
		//If there is no current game and we have enough players, start a new game.
		for (let i = 0; i < this.players.length; i++) {
			let player = this.players[i];
			if (!player) {
				// this.players.splice(i, 1);
				player = this.getNonSeatedPlayer();
				this.players[i] = player;
			}
		}
		this.game = new Game(this.smallBlind, this.bigBlind);

		this.dealer = this.GetFirstDealer();
		this.started = true;
		this.NewRound();
	} else { }// console.log("startgame err");
};

Table.prototype.getCurrentPlayerLabel = function () {
	let player = this.getCurrentPlayer();
	return "[" + this.currentPlayer + " - " + player.playerName + "] ";
};

Table.prototype.getCurrentPlayer = function () {
	return this.players[this.currentPlayer];
};

Table.prototype.getNonSeatedPlayer = function () {
	return new Player({
		playerName: "Empty seat",
		playerID: "",
		mode: "",
		table: this,
	});
};

Table.prototype.addPlayer = function (options) {
	if (!options.playerName || !options.playerID) {
		// console.log("player Name & ID is not defined", options);
		return;
	}
	let position;

	if (options.position === undefined || options.position == -1) {
		let i = 0;
		while (
			this.players[i] !== undefined &&
			this.players[i].playerName != "Empty seat"
		) {
			i++;
		}
		position = i;
		options.position = i;
	}

	position = options.position;

	if (position + 1 > this.maxPlayers) {
		console.log(
			`Parameter [maxPlayers] must be a postive integer of a max value of ${this.maxPlayers}`
				.error
		);
		return;
	}


	options.table = this;

	// remove previous position if player already seated on table
	for (let i = 0; i < this.players.length; i++) {
		let player = this.players[i];
		if (player && player.playerID === options.playerID) {
			this.players[i] = this.getNonSeatedPlayer();
			console.log(
				"remove previous position if player already seated on table".error
			);
			break;
		}
	}

	let playerSeated = new Player(options);
	playerSeated.isSeated = true;
	playerSeated.isOffline = options.isOffline
	this.players[position] = playerSeated;
	playerSeated.avatar = options.avatar;
	if (options.photoUrl !== undefined) playerSeated.photoUrl = options.photoUrl;
	if (options.photoType === null || options.photoType === undefined)
		options.photoType = 0;
	playerSeated.photoType = options.photoType;

	return position;
};

Table.prototype.RemovePlayer = function (playerID) {
	let player = this.getPlayerByID(playerID);
	if (player) {
		let playerIndex = player.getIndex();
		this.players[playerIndex] = this.getNonSeatedPlayer();
	}
};

Table.prototype.DealCardsResetBets = function () {
	let nbPlayers = this.players.length;
	//Deal 2 cards to each player
	for (let i = 0; i < nbPlayers; i += 1) {
		// only deal cards to real player
		if (this.players[i] && !this.players[i].isEmptySeat) {
			this.players[i].cards.push(this.game.deck.pop());
			this.players[i].cards.push(this.game.deck.pop());
		}
		this.game.bets[i] = 0;
		this.game.roundBets[i] = 0;
	}
	this.board = [];
	this.board1 = [];
	this.game.deck.pop();
	for (let i = 0; i < 5; i++) {
		if (i >= 3) this.game.deck.pop();
		this.board.push(this.game.deck.pop());
		this.board1.push(this.board[this.board.length - 1]);
	}
	//this.board1 = this.board;
};

Table.prototype.NewRound = function () {

	this.gameoverd = false;
	this.game.deck = this.fillDeck();
	let smallBlind, bigBlind;

	this.DealCardsResetBets();

	//Identify Small and Big Blind player indexes
	if (this.getIngamePlayersLength() > 2) {
		smallBlind = this.getNextPlayerIndex(this.dealer);
	} else {
		smallBlind = this.dealer;
	}
	bigBlind = this.getNextPlayerIndex(smallBlind);
	if (this.players[bigBlind].isWaitForBB == 1) {
		this.players[bigBlind].isWaitForBB = 0;
	}
	this.currentPlayer = smallBlind;

	//Force Blind Bets
	this.players[smallBlind].SimpleBet(this.smallBlind);
	this.currentPlayer = bigBlind;
	this.players[bigBlind].SimpleBet(this.bigBlind);

	if (!this.players[bigBlind].isAllIn) {
		this.players[bigBlind].talked = false;
	}

	this.emit("smallBlind", this.players[smallBlind]);
	this.emit("bigBlind", this.players[bigBlind]);

	// this.NextPlayer();
};

Table.prototype.getIngamePlayersLength = function () {
	let tot = 0;
	this.forEachPlayers(function () {
		tot++;
	});
	return tot;
};

Table.prototype.resetTalkedStatusOnRaise = function () {
	let self = this;
	this.forEachPlayers(function (player) {
		if (
			!player.folded &&
			!player.isAllIn &&
			player.GetBet() < self.getMaxBet()
		) {
			player.talked = false;
		}
	});
};

Table.prototype.NextPlayer = function () {
	//this.currentPlayer = this.getNextPlayerIndex(this.currentPlayer, true);
	this.currentPlayer = this.getNextPlayerIndex(this.currentPlayer);
	//var a = this.currentPlayer;
	let self = this;
	let cp = self.players[self.currentPlayer];
	if (cp) {
		self.emit("turn", cp);
	}
};
Table.prototype.roundNum = function (n) {
	let units = n.toString().length;
	let remains = 0;
	if (units % 3 == 0) remains = (units / 3 - 1) * 3;
	else remains = units - (units % 3);
	let a = Math.trunc(n / 10 ** remains) * 10 ** remains;
	return a;
};
module.exports = {
	Table: Table,
};
