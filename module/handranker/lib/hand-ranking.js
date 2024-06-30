'use strict';

var _ = require('underscore');
var Card = require('./card');

var TYPE_ROYAL_FLUSH     =   'royal flush';
var TYPE_STRAIGHT_FLUSH  =   'straight flush';
var TYPE_FOUR_OF_A_KIND  =   'four of a kind';
var TYPE_FULL_HOUSE      =   'full house';
var TYPE_FLUSH           =   'flush';
var TYPE_STRAIGHT        =   'straight';
var TYPE_THREE_OF_A_KIND =   'three of a kind';
var TYPE_TWO_PAIR        =   'two pair';
var TYPE_PAIR            =   'pair';
var TYPE_HIGH_CARD       =   'high card';

var ROYAL_FLUSH = {
    type: TYPE_ROYAL_FLUSH,
    validate: function(cards, hasStraight, hasFlush, onlyPairsCount){
        if(onlyPairsCount) return false;
        var aceHigh = cards[0].rank === Card.RANK_ACE;
        return aceHigh && hasStraight && hasFlush;
    },
    description: function(cards){
        return TYPE_ROYAL_FLUSH;
    }
};

var STRAIGHT_FLUSH = {
    type: STRAIGHT_FLUSH,
    validate: function(cards, hasStraight, hasFlush, onlyPairsCount){
        if(onlyPairsCount) return false;
        var aceHigh = cards[0].rank === Card.RANK_ACE;
        return !aceHigh && hasStraight && hasFlush;
    },
    description: function(cards){
        return 'straight flush '+Card.singularRankName(cards[0])+' high';
    }
};

var FOUR_OF_A_KIND = {
    type: TYPE_FOUR_OF_A_KIND,
    validate: function(cards){
        return hasPairArrangement(cards, [4,1]);
    },
    description: function(cards){
        return 'four of a kind of '+Card.pluralRankName(cards[0]);
    }
};

var FULL_HOUSE = {
    type: TYPE_FULL_HOUSE,
    validate: function(cards){
        return hasPairArrangement(cards, [3,2]);
    },
    description: function(cards){
        return 'full house '+Card.pluralRankName(cards[0])+' full of '+Card.pluralRankName(cards[3]);
    }
};

var FLUSH = {
    type: TYPE_FLUSH,
    validate: function(cards, hasStraight, hasFlush, onlyPairsCount){
        if(onlyPairsCount) return false;
        return !hasStraight && hasFlush;
    },
    description: function(cards){
        return 'flush '+Card.singularRankName(cards[0])+' high';
    }
};

var STRAIGHT = {
    type: TYPE_STRAIGHT,
    validate: function(cards, hasStraight, hasFlush, onlyPairsCount){
        if(onlyPairsCount) return false;
        return hasStraight && !hasFlush;
    },
    description: function(cards){
        return 'straight '+Card.singularRankName(cards[0])+' high';
    }
};

var THREE_OF_A_KIND = {
    type: TYPE_THREE_OF_A_KIND,
    validate: function(cards){
        return hasPairArrangement(cards, [3,1,1]);
    },
    description: function(cards){
        return 'three of a kind of '+Card.pluralRankName(cards[0]);
    }
};

var TWO_PAIR = {
    type: TYPE_TWO_PAIR,
    validate: function(cards){
        return hasPairArrangement(cards, [2,2,1]);
    },
    description: function(cards){
        return 'two pair of '+Card.pluralRankName(cards[0])+' and '+Card.pluralRankName(cards[2]);
    }
};

var PAIR = {
    type: TYPE_PAIR,
    validate: function(cards){
        return hasPairArrangement(cards, [2,1,1,1]);
    },
    description: function(cards){
        return 'a pair of '+Card.pluralRankName(cards[0]);
    }
};

var HIGH_CARD = {
    type: TYPE_HIGH_CARD,
    validate: function(cards, hasStraight, hasFlush, onlyPairsCount){
        var noPairs = hasPairArrangement(cards, [1,1,1,1,1]);
        if(onlyPairsCount){
            return noPairs;
        } else{
            return noPairs && !hasStraight && !hasFlush;
        }
    },
    description: function(cards){
        return Card.singularRankName(cards[0])+' high';
    }
};

var HAND_RANKING_MAP = {};
HAND_RANKING_MAP[TYPE_ROYAL_FLUSH]      =   ROYAL_FLUSH;
HAND_RANKING_MAP[TYPE_STRAIGHT_FLUSH]   =   STRAIGHT_FLUSH;
HAND_RANKING_MAP[TYPE_FOUR_OF_A_KIND]   =   FOUR_OF_A_KIND;
HAND_RANKING_MAP[TYPE_FULL_HOUSE]       =   FULL_HOUSE;
HAND_RANKING_MAP[TYPE_FLUSH]            =   FLUSH;
HAND_RANKING_MAP[TYPE_STRAIGHT]         =   STRAIGHT;
HAND_RANKING_MAP[TYPE_THREE_OF_A_KIND]  =   THREE_OF_A_KIND;
HAND_RANKING_MAP[TYPE_TWO_PAIR]         =   TWO_PAIR;
HAND_RANKING_MAP[TYPE_PAIR]             =   PAIR;
HAND_RANKING_MAP[TYPE_HIGH_CARD]        =   HIGH_CARD;

var HAND_RANKINGS = [TYPE_ROYAL_FLUSH, TYPE_STRAIGHT_FLUSH,
    TYPE_FOUR_OF_A_KIND, TYPE_FULL_HOUSE, TYPE_FLUSH, TYPE_STRAIGHT,
    TYPE_THREE_OF_A_KIND, TYPE_TWO_PAIR, TYPE_PAIR, TYPE_HIGH_CARD];

function compareHandRankings(ranking1, ranking2, cardCompare){
    if(!cardCompare) cardCompare = Card.compare;
    var r1 = _.indexOf(HAND_RANKINGS, ranking1.ranking);
    var r2 = _.indexOf(HAND_RANKINGS, ranking2.ranking);
    var distance = r2 - r1;
    if(distance > 0) return 1;
    else if(distance < 0) return -1;
    else{
        for(var i = 0; i < 5; i++){
            var card1 = ranking1.cards[i];
            var card2 = ranking2.cards[i];
            var compare = cardCompare(card1, card2);
            if(compare !== 0) return compare;
        }
    }
    return 0;
}

function compareAceHighHandRankings(ranking1, ranking2){
    return compareHandRankings(ranking1, ranking2, Card.compare);
}

function compareAceLowHandRankings(ranking1, ranking2){
    return compareHandRankings(ranking1, ranking2, Card.compareAceLow);
}

var HandRanking = function()
{

    var constructor = function HandRanking(cards, ranking, options)
    {
        if(cards.length !== 5) throw "hand ranking is found using five cards";
        if(!HAND_RANKING_MAP[ranking]) throw 'hand ranking not valid';
        if(!options) options = {formed: false};

        this.cards = (options.formed) ? cards : formCards(Card.objectifyCards(cards), options);
        this.hasStraight = (options.hasStraight === undefined) ? isStraight(this.cards) : options.hasStraight;
        this.hasFlush = (options.hasFlush === undefined) ? isFlush(this.cards) : options.hasFlush;
        this.onlyPairsCount = (options.onlyPairsCount === undefined) ? false : options.onlyPairsCount;
        this.aceHigh = (options.aceHigh === undefined) ? true : options.aceHigh;
        this.ranking = ranking;

        this.cards = arrangeCards(this.cards, options);

        this.isValid = function(){
            return HAND_RANKING_MAP[this.ranking].validate(this.cards, this.hasStraight, this.hasFlush, this.onlyPairsCount);
        };

        this.description = HAND_RANKING_MAP[this.ranking].description(this.cards);
    };

    constructor.ROYAL_FLUSH     =   TYPE_ROYAL_FLUSH;
    constructor.STRAIGHT_FLUSH  =   TYPE_STRAIGHT_FLUSH;
    constructor.FOUR_OF_A_KIND  =   TYPE_FOUR_OF_A_KIND;
    constructor.FULL_HOUSE      =   TYPE_FULL_HOUSE;
    constructor.FLUSH           =   TYPE_FLUSH;
    constructor.STRAIGHT        =   TYPE_STRAIGHT;
    constructor.THREE_OF_A_KIND =   TYPE_THREE_OF_A_KIND;
    constructor.TWO_PAIR        =   TYPE_TWO_PAIR;
    constructor.PAIR            =   TYPE_PAIR;
    constructor.HIGH_CARD       =   TYPE_HIGH_CARD;

    constructor.HAND_RANKINGS = [TYPE_ROYAL_FLUSH, TYPE_STRAIGHT_FLUSH,
        TYPE_FOUR_OF_A_KIND, TYPE_FULL_HOUSE, TYPE_FLUSH, TYPE_STRAIGHT,
        TYPE_THREE_OF_A_KIND, TYPE_TWO_PAIR, TYPE_PAIR, TYPE_HIGH_CARD];

    constructor.compareHandRankings = compareHandRankings;
    constructor.compareAceHighHandRankings = compareAceHighHandRankings;
    constructor.compareAceLowHandRankings = compareAceLowHandRankings;
    constructor.containsStraight = isStraight;
    constructor.containsFlush = isFlush;
    constructor.formCards = formCards;
    constructor.eightOrBetter = eightOrBetter;

    constructor.sortHandRankings = function (rankings, aceHigh) {
        if(aceHigh === undefined) aceHigh = true;
        var sorted = _.extend([], rankings);
        var sort = (aceHigh) ? compareAceHighHandRankings : compareAceLowHandRankings;
        return sorted.sort(sort);
    };

    return constructor;
}();

module.exports = HandRanking;

function formCards(cards, options){
    if(options === undefined) options = {onlyPairsCount: false, aceHigh: true};
    cards = Card.sortCards(cards, options.aceHigh).reverse();
    if(isWheel(cards) && !options.onlyPairsCount){
        cards = [cards[1], cards[2], cards[3], cards[4], cards[0]];
    }
    return cards;
}

function arrangeCards(cards, options){
    var arranged = [];
    for(var i = 4; i > 0; i--){
        var matching = _.filter(cards, function(card){
            var counter = 0;
            cards.forEach(function(c){
                if(c.rank === card.rank) counter++;
            });
            return counter === i;
        });
        arranged.push(matching);
    }
    return _.flatten(arranged);
}

function hasPairArrangement(cards, pairArrangement){
    var ranks = _.uniq(_.pluck(cards, 'rank'));
    var pairCounts = [];
    ranks.forEach(function(rank){
        var rankCount = _.where(cards, {rank: rank}).length;
        pairCounts.push(rankCount);
    });
    return pairCounts.join(',') === pairArrangement.join(',');
}

function isStraight(cards){
    return isHighStraight(cards) || isFormedWheel(cards);
}

function isHighStraight(cards){
    for(var i = 1; i < cards.length; i++){
        var card1 = cards[i-1];
        var card2 = cards[i];
        var connected = Card.distance(card1, card2) === -1;
        if(!connected) return false;
    }
    return true;
}

function isWheel(cards){
    var ace = cards[0].rank === Card.RANK_ACE;
    var five = cards[1].rank === Card.RANK_FIVE;
    var four = cards[2].rank === Card.RANK_FOUR;
    var three = cards[3].rank === Card.RANK_THREE;
    var two = cards[4].rank === Card.RANK_TWO;
    return ace && five && four && three && two;
}

function isFormedWheel(cards){
    var five = cards[0].rank === Card.RANK_FIVE;
    var four = cards[1].rank === Card.RANK_FOUR;
    var three = cards[2].rank === Card.RANK_THREE;
    var two = cards[3].rank === Card.RANK_TWO;
    var ace = cards[4].rank === Card.RANK_ACE;
    return ace && five && four && three && two;
}

function isFlush(cards){
    var suit = cards[0].suit;
    for(var i =0; i < cards.length; i++){
        var wrongSuit = cards[i].suit !== suit;
        if(wrongSuit) return false;
    }
    return true;
}

function eightOrBetter(handRanking){
    var noPairs = hasPairArrangement(handRanking.cards, [1,1,1,1,1])
    var firstCard = handRanking.cards[0];
    var eight = new Card(Card.RANK_EIGHT, Card.SUIT_CLUB);
    var compare = Card.compareAceLow(firstCard, eight);
    return compare != 1 && noPairs;
}