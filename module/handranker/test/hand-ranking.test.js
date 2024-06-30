'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('HandRanking', function(){

    describe('input', function(){

        it('should not allow less than five cards', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'}
            ];

            (function(){
                new HandRanking(cards, HandRanking.ROYAL_FLUSH);
            }).should.throw();
        });

        it('should not allow more than five cards', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'},
                {rank: '9', suit: 's'},
                {rank: 'A', suit: 's'}
            ];

            (function(){
                new HandRanking(cards, HandRanking.ROYAL_FLUSH);
            }).should.throw();
        });

        it('should not allow invalid hand ranking', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'},
                {rank: '9', suit: 's'},
            ];

            (function(){
                new HandRanking(cards, '');
            }).should.throw();
        });

        it('should allow cards that are array of strings', function(){
            var cards = ['As', 'Ks', 'Qs', 'Js', 'Ts'];
            var hr = new HandRanking(cards, HandRanking.ROYAL_FLUSH);
            hr.isValid().should.be.true;
        });

        it('should allow cards that are array of arrays', function(){
            var cards = [['A','s'], ['K', 's'], ['Q','s'], ['J','s'], ['T','s']];
            var hr = new HandRanking(cards, HandRanking.ROYAL_FLUSH);
            hr.isValid().should.be.true;
        });

        it('should allow cards that are array of objects', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.ROYAL_FLUSH);
            hr.isValid().should.be.true;
        });

        it('should allow cards that are array of cards', function(){
            var cards = [
                new Card('As'),
                new Card('Ks'),
                new Card('Qs'),
                new Card('Js'),
                new Card('Ts')
            ];
            var hr = new HandRanking(cards, HandRanking.ROYAL_FLUSH);
            hr.isValid().should.be.true;
        });
    });

    describe('reorder', function(){

        it('should reorder cards for by rank', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '3', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'T', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.cards[1].rank.should.eql(Card.RANK_KING);
        });

        it('should reorder pairs first', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '4', suit: 'd'},
                {rank: '4', suit: 'c'},
                {rank: '4', suit: 'h'},
                {rank: '4', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.FOUR_OF_A_KIND);
            hr.cards[0].rank.should.eql(Card.RANK_FOUR);
        });

        it('should reorder cards for wheel', function(){
            var cards = [
                {rank: '5', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: '3', suit: 's'},
                {rank: '2', suit: 's'},
                {rank: 'A', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT_FLUSH);
            hr.cards[0].rank.should.eql(Card.RANK_FIVE);
        });

    });

    describe('eight or better', function(){

        it('should be true for 8653A', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '3', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: '6', suit: 's'},
                {rank: '8', suit: 's'}
            ];
            var options = {formed: false, aceHigh: false, onlyPairsCount: true, eightOrBetter: true};
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD, options);
            HandRanking.eightOrBetter(hr).should.be.true;
            hr.cards[0].rank.should.be.eql(Card.RANK_EIGHT);
        });

        it('should be true for 5432A', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '3', suit: 's'},
                {rank: '5', suit: 's'},
                {rank: '2', suit: 's'},
                {rank: '4', suit: 's'}
            ];
            var options = {formed: false, aceHigh: false, onlyPairsCount: true, eightOrBetter: true};
            var hr = new HandRanking(cards, HandRanking.FLUSH, options);
            HandRanking.eightOrBetter(hr).should.be.true;
            hr.cards[0].rank.should.be.eql(Card.RANK_FIVE);
        });

        it('should be false for 9654A', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '9', suit: 's'},
                {rank: '5', suit: 's'},
                {rank: '6', suit: 's'},
                {rank: '4', suit: 's'}
            ];
            var options = {formed: false, aceHigh: false, onlyPairsCount: true, eightOrBetter: true};
            var hr = new HandRanking(cards, HandRanking.FLUSH, options);
            HandRanking.eightOrBetter(hr).should.be.false;
            hr.cards[0].rank.should.be.eql(Card.RANK_NINE);
        });

        it('should be false for 3362A', function(){
            var cards = [
                {rank: '3', suit: 's'},
                {rank: '3', suit: 'c'},
                {rank: '6', suit: 's'},
                {rank: '2', suit: 's'},
                {rank: 'A', suit: 's'}
            ];
            var options = {formed: false, aceHigh: false, onlyPairsCount: true, eightOrBetter: true};
            var hr = new HandRanking(cards, HandRanking.FLUSH, options);
            HandRanking.eightOrBetter(hr).should.be.false;
        });
    });
});