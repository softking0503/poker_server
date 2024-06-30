## Node-Poker
Event based poker engine for node.

Please note that the project is still early in development, and some changes can be not backward compatible. 

## Installation

```bash
$ npm install poker-engine
```

## Usage:
```js
var Poker = require("poker-engine");

// pass init parameters, and optional array of players to initialize a table
var table = poker.newTable({
	minBlind: 10,
	maxBlind: 20,
	maxPlayers : 6
},[
	{
		playerName : "johnnyboy",
		chips: 100
	},
	{
		playerName : "bobbyboy",
		chips: 200
	},
]); 

// or add a player when you need it
table.addPlayer({
	playerName : "robbyboy",
	chips: 300
});


// start a table!
table.startGame();
```

## Events:
```js
table.on("turn",function(player){
	player.call();
	// or
	// player.bet(20)
	// player.fold()
	// player.allIn()
	// player.check()
});


table.on("win",function(player,prize){
	// custom logic executed upon win
});

table.on("gameOver",function(){
	table.initNewRound()
});

```


## Roadmap
1. Tests in Mocha
2. Player model to be extendable
3. Comprehensive event docs