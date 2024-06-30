"use strict";

var _ = require("underscore");

var TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  TEN = "T",
  JACK = "J",
  QUEEN = "Q",
  KING = "K",
  ACE = "A";

var SPADES = "S",
  HEARTS = "H",
  DIAMONDS = "D",
  CLUBS = "C";

var RANKS = [
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
  ACE,
];
var ACE_LOW_RANKS = [
  ACE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
];
var SUITS = [SPADES, HEARTS, DIAMONDS, CLUBS];

var RANK_NAME_MAP = {
  2: { singular: "two", plural: "twos" },
  3: { singular: "three", plural: "threes" },
  4: { singular: "four", plural: "fours" },
  5: { singular: "five", plural: "fives" },
  6: { singular: "six", plural: "sixes" },
  7: { singular: "seven", plural: "sevens" },
  8: { singular: "eight", plural: "eights" },
  9: { singular: "nine", plural: "nines" },
  T: { singular: "ten", plural: "tens" },
  J: { singular: "jack", plural: "jacks" },
  Q: { singular: "queen", plural: "queens" },
  K: { singular: "king", plural: "kings" },
  A: { singular: "ace", plural: "aces" },
};

var SUIT_NAME_MAP = {
  s: { singular: "spade", plural: "spades" },
  h: { singular: "heart", plural: "hearts" },
  d: { singular: "diamond", plural: "diamonds" },
  c: { singular: "club", plural: "clubs" },
};

function getDistance(card1, card2) {
  var index1 = _.indexOf(RANKS, card1.rank);
  var index2 = _.indexOf(RANKS, card2.rank);
  return index2 - index1;
}

function compareCards(card1, card2) {
  var distance = getDistance(card1, card2);
  if (distance > 0) return -1;
  else if (distance < 0) return 1;
  else return 0;
}

function compareCardsAceLow(card1, card2) {
  var index1 = _.indexOf(ACE_LOW_RANKS, card1.rank);
  var index2 = _.indexOf(ACE_LOW_RANKS, card2.rank);
  var distance = index2 - index1;
  if (distance > 0) return -1;
  else if (distance < 0) return 1;
  else return 0;
}

var Card = (function () {
  var constructor = function Card(rank, suit) {
    if (arguments.length === 1) {
      if (_.isString(arguments[0])) {
        this.rank = arguments[0].substring(0, 1);
        this.suit = arguments[0].substring(1, 2);
      } else if (_.isArray(arguments[0])) {
        this.rank = arguments[0][0];
        this.suit = arguments[0][1];
      } else {
        var card = _.extend({}, rank);
        this.rank = card.rank;
        this.suit = card.suit;
      }
    } else if (arguments.length === 2) {
      this.rank = rank;
      this.suit = suit;
    } else throw "invalid number of arguments";

    if (!_.contains(RANKS, this.rank)) throw "invalid rank";
    if (!_.contains(SUITS, this.suit)) {
        // console.log("invalid suit", this.suit);
      //throw "invalid suit";
    }
  };

  constructor.RANKS = RANKS;
  constructor.ACE_LOW_RANKS = ACE_LOW_RANKS;
  constructor.SUITS = SUITS;

  constructor.SUIT_SPADE = SPADES;
  constructor.SUIT_HEART = HEARTS;
  constructor.SUIT_DIAMOND = DIAMONDS;
  constructor.SUIT_CLUB = CLUBS;

  constructor.RANK_TWO = TWO;
  constructor.RANK_THREE = THREE;
  constructor.RANK_FOUR = FOUR;
  constructor.RANK_FIVE = FIVE;
  constructor.RANK_SIX = SIX;
  constructor.RANK_SEVEN = SEVEN;
  constructor.RANK_EIGHT = EIGHT;
  constructor.RANK_NINE = NINE;
  constructor.RANK_TEN = TEN;
  constructor.RANK_JACK = JACK;
  constructor.RANK_QUEEN = QUEEN;
  constructor.RANK_KING = KING;
  constructor.RANK_ACE = ACE;

  constructor.sortCards = function (cards, aceHigh) {
    if (aceHigh === undefined) aceHigh = true;
    var sorted = _.extend([], cards);
    if (aceHigh) sorted.sort(compareCards);
    else sorted.sort(compareCardsAceLow);
    return sorted;
  };

  constructor.compare = function (card1, card2) {
    return compareCards(card1, card2);
  };

  constructor.compareAceLow = function (card1, card2) {
    return compareCardsAceLow(card1, card2);
  };

  constructor.greaterThan = function (card1, card2) {
    return compareCards(card1, card2) === 1;
  };

  constructor.lessThan = function (card1, card2) {
    return compareCards(card1, card2) === -1;
  };

  constructor.distance = function (card1, card2) {
    return getDistance(card1, card2);
  };

  constructor.singularRankName = function (card) {
    return RANK_NAME_MAP[card.rank].singular;
  };
  constructor.pluralRankName = function (card) {
    return RANK_NAME_MAP[card.rank].plural;
  };
  constructor.singularSuitName = function (card) {
    return SUIT_NAME_MAP[card.suit].singular;
  };
  constructor.pluralSuitName = function (card) {
    return SUIT_NAME_MAP[card.suit].plural;
  };

  constructor.objectifyCards = function (cards) {
    return _.map(cards, function (card) {
      return new Card(card);
    });
  };

  return constructor;
})();

// exports
module.exports = Card;
