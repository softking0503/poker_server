'use strict';

var _ = require('underscore');
var Card = require('./card');
var HandRanking = require('./hand-ranking');
var Combinations = require('./combinations');

// win types
var WIN_TYPE_HIGH = "high"; // default
var WIN_TYPE_LOW = "low";
var WIN_TYPE_HI_LO = "hi/lo";

// hand ranking options
var TEXAS_HOLDEM = {
    winType: WIN_TYPE_HIGH,
    aceHigh: true,
    onlyPairsCount: false,
    omaha: false,
    eightOrBetter: false
};

var OMAHA = {
    winType: WIN_TYPE_HIGH,
    aceHigh: true,
    onlyPairsCount: false,
    omaha: true,
    eightOrBetter: false
};

var OMAHA_LOW = {
    winType: WIN_TYPE_LOW,
    aceHigh: false,
    onlyPairsCount: true,
    omaha: true,
    eightOrBetter: true
};

var SEVEN_CARD_STUD_LOW = {
    winType: WIN_TYPE_LOW,
    aceHigh: false,
    onlyPairsCount: true,
    omaha: false,
    eightOrBetter: true
};

var DEUCE_TO_SEVEN = {
    winType: WIN_TYPE_LOW,
    aceHigh: true,
    onlyPairsCount: false,
    omaha: false,
    eightOrBetter: false
};

var DEUCE_TO_SIX = {
    winType: WIN_TYPE_LOW,
    aceHigh: true,
    onlyPairsCount: true,
    omaha: false,
    eightOrBetter: false
};

var ACE_TO_FIVE = {
    winType: WIN_TYPE_LOW,
    aceHigh: false,
    onlyPairsCount: true,
    omaha: false,
    eightOrBetter: false
};

var ACE_TO_SIX = {
    winType: WIN_TYPE_LOW,
    aceHigh: false,
    onlyPairsCount: false,
    omaha: false,
    eightOrBetter: false
};

var OMAHA_HI_LO = {
    winType: WIN_TYPE_HI_LO,
    aceHigh: true,
    onlyPairsCount: false,
    omaha: true,
    eightOrBetter: true
};

var SEVEN_CARD_STUD_HI_LO = {
    winType: WIN_TYPE_HI_LO,
    aceHigh: true,
    onlyPairsCount: false,
    omaha: false,
    eightOrBetter: true
};

var TYPE_TEXAS_HOLDEM = "Texas Holdem";
var TYPE_OMAHA_HI = "Omaha Hi";
var TYPE_OMAHA_HI_LO = "Omaha Hi/Lo";
var TYPE_STUD = "Stud";
var TYPE_STUD_HI_LO = "Stud Hi/Lo";
var TYPE_RAZZ = "Razz";
var TYPE_KANSAS_CITY_LOWBALL = "Kansas City Lowball";
var TYPE_CALIFORNIA_LOWBALL = "California Lowball"
var TYPE_DEUCE_TO_SEVEN = "Deuce to Seven";
var TYPE_DEUCE_TO_SIX = "Deuce to Six";
var TYPE_ACE_TO_SIX = "Ace to Six";

var GAME_TYPE_MAP = {
    "Texas Holdem" : TEXAS_HOLDEM,
    "Omaha Hi" : OMAHA,
    "Omaha Hi/Lo" : OMAHA_HI_LO,
    "Stud" : TEXAS_HOLDEM,
    "Stud Hi/Lo" : SEVEN_CARD_STUD_HI_LO,
    "Razz" : ACE_TO_FIVE,
    "Kansas City Lowball" : DEUCE_TO_SEVEN,
    "California Lowball" : ACE_TO_FIVE,
    "Deuce to Seven" : DEUCE_TO_SEVEN,
    "Deuce to Six" : DEUCE_TO_SIX,
    "Ace to Six"  : ACE_TO_SIX
};

function orderHands(hands, second, third){
    var board = [];
    var options = TEXAS_HOLDEM;
    if(_.isArray(second)){
        board = second;
        if(_.isString(third)){
            options = GAME_TYPE_MAP[third];
        }
    } else if(_.isString(second)){
        options = GAME_TYPE_MAP[second];
    }
    if(!options) throw 'Unsupported Game Type';

    hands = _.map(hands, function(hand){
        return {
            id: hand.id,
            cards:Card.objectifyCards(hand.cards)
        }
    });

    board = Card.objectifyCards(board);

    if(options.winType === WIN_TYPE_HI_LO){
        var optionsMap = (options.omaha) ? {high: OMAHA, low: OMAHA_LOW} :
        {high: TEXAS_HOLDEM, low: SEVEN_CARD_STUD_LOW};
        var high = formHandRankingsFromHand(hands, board, optionsMap.high);
        var low = formHandRankingsFromHand(hands, board, optionsMap.low);
        return { high: high, low: low };
    }
    return formHandRankingsFromHand(hands, board, options);
}

function formHandRankingsFromHand(hands, board, options){
    var highRankings = _.map(hands, function(hand){
        return {
            id: hand.id,
            cards: hand.cards,
            board: board,
            handRanking: getHandRanking(hand.cards, board, options)
        }
    });

    return sortAndGroupHands(highRankings, options);
}

function sortAndGroupHands(handRankings, options){
    var high = options.winType === WIN_TYPE_HIGH;
    handRankings.sort(function(hand1, hand2){
        var compareFunction = (options.aceHigh) ? HandRanking.compareAceHighHandRankings :
            HandRanking.compareAceLowHandRankings;
        var compare = compareFunction(hand1.handRanking, hand2.handRanking);
        return (high) ? compare : compare * -1;
    });

    if(options.eightOrBetter){
        handRankings = _.filter(handRankings, function(hr){
            return HandRanking.eightOrBetter(hr.handRanking);
        });
        if(handRankings.length === 0) return false;
    }

    var results = [ [ handOutputFromHandRanking(handRankings[0]) ] ];
    for(var i = 1; i < handRankings.length; i++){
        var current = handRankings[i];
        var last = handRankings[i-1];
        var compareFunction = (options.aceHigh) ? HandRanking.compareAceHighHandRankings :
            HandRanking.compareAceLowHandRankings;
        var compare = compareFunction(current.handRanking, last.handRanking);
        var output = handOutputFromHandRanking(current);
        if(compare === 0){
            _.last(results).push(output);
        } else {
            results.push( [ output ] );
        }
    }
    return results.reverse();
}

function handOutputFromHandRanking(handRanking){
    return {
        id: handRanking.id,
        ranking: handRanking.handRanking.ranking,
        cards: handRanking.cards,
        board: handRanking.board,
        playingCards: handRanking.handRanking.cards,
        description: handRanking.handRanking.description
    };
}

function getHand(cards, second, third){
    var board = [];
    var options = TEXAS_HOLDEM;
    if(_.isArray(second)){
        board = second;
        if(_.isString(third)){
            options = GAME_TYPE_MAP[third];
        }
    } else if(_.isString(second)){
        options = GAME_TYPE_MAP[second];
    }
    if(!options) throw 'Unsupported Game Type';

    cards = Card.objectifyCards(cards);
    board = Card.objectifyCards(board);

    var best = getHandRanking(cards, board, options);
    return {
        ranking: best.ranking,
        cards: cards,
        board: board,
        playingCards: best.cards,
        description: best.description
    };
}

function getHandRanking(cards, board, options){
    if(options.omaha){
        var handRankings = _.map(omahaCardCombinations(cards, board), function(c){
            return bestHandRanking(c, options);
        });
        var sorted = HandRanking.sortHandRankings(handRankings, options.aceHigh);
        if(options.winType === WIN_TYPE_HIGH){
            return _.last(sorted);
        } else if(options.winType === WIN_TYPE_LOW){
            return _.first(sorted);
        }
    } else{
        return bestHandRanking(cards.concat(board), options);
    }
}

function bestHandRanking(cards, options){
    var combinations = Combinations.find(cards, 5);
    var handRankings = _.map(combinations, function(c){
        return fiveCardHandRanking(c, options);
    });
    var sorted = HandRanking.sortHandRankings(handRankings, options.aceHigh);
    if(options.winType === WIN_TYPE_HIGH){
        return _.last(sorted);
    } else if(options.winType === WIN_TYPE_LOW){
        return _.first(sorted);
    }
}

function omahaCardCombinations(cards, board){
    var handCombinations = Combinations.find(cards, 2);
    var boardCombinations = Combinations.find(board, 3);
    var combinations = [];
    _.each(handCombinations, function(hc){
        _.each(boardCombinations, function(bc){
            combinations.push(hc.concat(bc));
        });
    });
    return combinations;
}

function fiveCardHandRanking(cards, options){
    var rankings = HandRanking.HAND_RANKINGS;

    // cache hasFlush and hasStraight so they don't calculate them every time
    // cache formed cards so they aren't reformed every time
    var formedCards = HandRanking.formCards(cards, options);
    var hasStraight = HandRanking.containsStraight(formedCards);
    var hasFlush = HandRanking.containsFlush(formedCards);

    for(var i = rankings.length-1; i >= 0; i--){
        var ranking = rankings[i];
        var handRankingOptions = {
            hasStraight: hasStraight,
            hasFlush: hasFlush,
            formed: true,
            onlyPairsCount: options.onlyPairsCount,
            aceHigh: options.aceHigh
        };
        var hr = new HandRanking(formedCards, ranking, handRankingOptions);
        if(hr.isValid()) return hr;
    }

    throw 'no hand ranking was found';
}

function deck(){
    var cards = [];
    _.each(Card.RANKS, function(rank){
        _.each(Card.SUITS, function(suit){
            cards.push(new Card(rank, suit));
        });
    });
    return cards;
}


// exports
exports.getHand = getHand;
exports.orderHands = orderHands;
exports.deck = deck;

exports.TEXAS_HOLDEM = TYPE_TEXAS_HOLDEM;
exports.OMAHA_HI = TYPE_OMAHA_HI;
exports.OMAHA_HI_LO = TYPE_OMAHA_HI_LO;
exports.STUD = TYPE_STUD;
exports.STUD_HI_LO = TYPE_STUD_HI_LO;
exports.RAZZ = TYPE_RAZZ;
exports.KANSAS_CITY_LOWBALL = TYPE_KANSAS_CITY_LOWBALL;
exports.CALIFORNIA_LOWBALL = TYPE_CALIFORNIA_LOWBALL;
exports.DEUCE_TO_SEVEN = TYPE_DEUCE_TO_SEVEN;
exports.DEUCE_TO_SIX = TYPE_DEUCE_TO_SIX;
exports.ACE_TO_SIX = TYPE_ACE_TO_SIX;

exports.GAME_TYPES = [TYPE_TEXAS_HOLDEM, TYPE_OMAHA_HI, TYPE_OMAHA_HI_LO, TYPE_STUD, TYPE_STUD_HI_LO, TYPE_RAZZ, TYPE_KANSAS_CITY_LOWBALL,
    TYPE_CALIFORNIA_LOWBALL, TYPE_DEUCE_TO_SEVEN, TYPE_DEUCE_TO_SIX, TYPE_ACE_TO_SIX];

exports.HIGH = WIN_TYPE_HIGH;
exports.LOW = WIN_TYPE_LOW;

exports.RANKS = Card.RANKS;
exports.SUITS = Card.SUITS;