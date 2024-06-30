'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');

describe('Card', function(){

    describe('creation', function(){

        it('should create card with rank and suit', function(){
            var card = new Card('A', 's');
            card.rank.should.eql(Card.RANK_ACE);
            card.suit.should.eql(Card.SUIT_SPADE);
        });

        it('should create card with rank and suit from an object literal', function(){
            var card = new Card({rank: "A", suit:"s"});
            card.rank.should.eql('A');
            card.suit.should.eql('s');
        });

        it('should create card with rank and suit from a string', function(){
            var card = new Card('As');
            card.rank.should.eql('A');
            card.suit.should.eql('s');
        });

        it('should create card with rank and suit from an array', function(){
            var card = new Card(['A', 's']);
            card.rank.should.eql('A');
            card.suit.should.eql('s');
        });

        it('should create card from another card', function(){
            var card = new Card(['A', 's']);
            var card2 = new Card(card);
            card2.rank.should.eql('A');
            card2.suit.should.eql('s');
        });

        it('should not allow invalid rank', function(){
            (function(){
                new Card('B', 's');
            }).should.throw();
        });

        it('should not allow invalid suit', function(){
            (function(){
                new Card({rank: "A", suit: "="});
            }).should.throw();
        });
    });

    describe('name', function(){

        it('should display singular rank correctly', function(){
            var card = new Card('A', 's');
            Card.singularRankName(card).should.eql('ace');
        });

        it('should display plural rank correctly', function(){
            var card = new Card('A', 's');
            Card.pluralRankName(card).should.eql('aces');
        });

        it('should display singular suit correctly', function(){
            var card = new Card('A', 's');
            Card.singularSuitName(card).should.eql('spade');
        });

        it('should display plural suit correctly', function(){
            var card = new Card('A', 's');
            Card.pluralSuitName(card).should.eql('spades');
        });

    });

    describe('comparison', function(){

        it('should have higher ranks ranked higher', function(){
            var card1 = new Card({rank: 'A', suit: 's'});
            var card2 = new Card({rank: 'K', suit: 's'});
            Card.greaterThan(card1, card2).should.be.true;
        });

        it('should have lower ranks ranked lower', function(){
            var card1 = new Card({rank: 'A', suit: 's'});
            var card2 = new Card({rank: 'K', suit: 's'});
            Card.lessThan(card1, card2).should.be.false;
        });

        it('should calculate distance correctly', function(){
            var card1 = new Card({rank: 'A', suit: 's'});
            var card2 = new Card({rank: 'K', suit: 's'});
            Card.distance(card1, card2).should.be.eql(-1);
            Card.distance(card2, card1).should.be.eql(1);
        });

        it('should sort cards by rank in order', function(){
            var card1 = new Card({rank: '4', suit: 's'});
            var card2 = new Card({rank: 'A', suit: 's'});
            var card3 = new Card({rank: '3', suit: 's'});
            var card4 = new Card({rank: 'K', suit: 's'});

            var unsortedArray = [card1, card2, card3, card4];
            var sortedArray = [card3, card1, card4, card2];

            Card.sortCards(unsortedArray).should.eql(sortedArray);
        });

        it('should sort cards by rank in order for ace low', function(){
            var card1 = new Card({rank: '4', suit: 's'});
            var card2 = new Card({rank: 'A', suit: 's'});
            var card3 = new Card({rank: '3', suit: 's'});
            var card4 = new Card({rank: 'K', suit: 's'});

            var unsortedArray = [card1, card2, card3, card4];
            var sortedArray = [card2, card3, card1, card4];

            Card.sortCards(unsortedArray, false).should.eql(sortedArray);
        });
    });
})