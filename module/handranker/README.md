Ranker
======

Ranker is a poker hand ranking program written in javascript and available through npm.  
It can be used to evaluate a hand or rank a series of hands.  It supports the following game types:

- Texas Holdem
- Omaha Hi
- Omaha Hi/Lo
- Stud
- Stud Hi/Lo
- Razz
- Kansas City Lowball
- California Lowball
- Deuce to Seven
- Deuce to Six
- Ace to Six

Installation
---------------------

Ranker is available through npm:

```
  $ npm install handranker
```

Usage
---------------------

Evaluate a single hand:

```
  var Ranker = require('handranker');
  var cards = ['3s', '3c', 'Ac', 'Ah', '3d'];
  var result = Ranker.getHand(cards);
```  

Produces the following result:

```
    ranking: 'full house',
    cards: [ 
      { rank: '3', suit: 's' },
      { rank: '3', suit: 'c' },
      { rank: 'A', suit: 'c' },
      { rank: 'A', suit: 'h' },
      { rank: '3', suit: 'd' } 
    ],
    board: [],
    playingCards: [ 
        { rank: '3', suit: 'd' },
        { rank: '3', suit: 'c' },
        { rank: '3', suit: 's' },
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'c' } 
    ],
    description: 'full house threes full of aces' 
  }
```

Multiple hands can be ranked and board cards can be specified:

```

  var hand1 = {id: 1, cards: ['Ac', '5c']}; // tie
  var hand2 = {id: 2, cards: ['Ad', '8d']}; // tie
  var hand3 = {id: 3, cards: ['Kh', 'Jc']}; // win
  var board = ['Th', '9h', 'Tc', '6c', 'Jh'];
  var hands = [hand1, hand2, hand3];
  var results = Ranker.orderHands(hands, board);

```

The hands are ranked with higher ranked hands first keeping their original id. Tieing hands are grouped together:


```

[
  [
    { id: 3,
      ranking: 'two pair',
      cards: [ ... ],
      board: [ ... ],
      playingCards: [ ... ],
      description: 'two pair jacks and tens' }
  ],
  [ 
    { id: 1,
      ranking: 'pair',
      cards: [ ... ],
      board: [ ... ],
      playingCards: [ ... ],
      description: 'a pair of tens' },
    { id: 2,
      ranking: 'pair',
      cards: [ ... ],
      board: [ ... ],
      playingCards: [ ... ],
      description: 'a pair of tens' } 
  ]
]


```

Hands can be ranked with a game type, Ranker.TEXAS_HOLDEM is the default.  Below Omaha Hi is shown:

```
  var board = ['Ts', '9s', '8s', '3h', '2h'];
  var hand1 = {id: 1, cards: ['As', 'Ks', 'Qs', 'Js']};
  var hand2 = {id: 2, cards: ['2s', '2c', '9c', '8c']};
  var hand3 = {id: 3, cards: ['4c', '4s', '5h', '5c']};
  var hand4 = {id: 4, cards: ['7s', '6s', '3c', '2c']};
  var hands = [hand1, hand2, hand3, hand4];
  var results = Ranker.orderHands(hands, board, Ranker.OMAHA_HI);
```

Hi/Lo is also supported.  High and low hands are grouped and low can be qualified by eight or better.  Below is a complex Stud Hi/Lo hand:

```
var hand1 = {id: 1, cards: ['Js', '7d', '4c', '3c', 'Qc', '3s', 'Td']};
var hand2 = {id: 2, cards: ['7h', '6h', 'Th', '9s', 'Ks', 'Kc', '4d']};
var hand3 = {id: 3, cards: ['2s', 'Ah', '2d', '2c', '6s', 'Ts', 'Qd']};
var hand4 = {id: 4, cards: ['5c', '4s', 'Ac', '3d', '8d', 'Jd', 'Jc']};
var hand5 = {id: 5, cards: ['8h', 'Ad', '5h', '4h', '3h', '8c', '8s']};
var hand6 = {id: 6, cards: ['As', 'Qs', 'Tc', 'Kh', 'Jh', '2h', '5s']};
var hands = [hand1, hand2, hand3, hand4, hand5, hand6];
var results = Ranker.orderHands(hands, Ranker.STUD_HI_LO)
```

```
{ "low" : 
[ [ { id: 4,
      ranking: 'high card',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'eight high' },
    { id: 5,
      ranking: 'high card',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'eight high' } ] ]
  "high" :      
[
  [ { id: 6,
      ranking: 'straight',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'straight ace high' } ],
  [ { id: 5,
      ranking: 'three of a kind',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'three of a kind eights' } ],
  [ { id: 3,
      ranking: 'three of a kind',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'three of a kind twos' } ],
  [ { id: 2,
      ranking: 'pair',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'a pair of kings' } ],
  [ { id: 4,
      ranking: 'pair',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'a pair of jacks' } ],
  [ { id: 1,
      ranking: 'pair',
      cards: [Object],
      board: [],
      playingCards: [Object],
      description: 'a pair of threes' } ]
 ]
}
```

Ranker has a convenience method for a deck, also Ranker can except cards in multiple formats.

```

var _ = require('underscore');
var Ranker = require('handranker');

var cards = _.shuffle( Ranker.deck() );


Ranker.getHand(['As', 'Ks', 'Qs', 'Js', 'Ts']);

Ranker.getHand([
  {rank: "A", suit: "s"},
  {rank: "K", suit: "s"},
  {rank: "Q", suit: "s"},
  {rank: "J", suit: "s"},
  {rank: "T", suit: "s"},
]);

Ranker.getHand([
  ["A","s"],
  ["K","s"],
  ["Q","s"],
  ["J","s"],
  ["T","s"]
]);
```

Ranks and Suits allowed by ranker:

```

var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
var SUITS = ['s', 'h', 'd', 'c'];

```

