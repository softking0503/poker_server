'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Pair', function(){

    describe('validation', function(){

        it('should be valid for Ks Kd Qc Jh As', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'K', suit: 'c'},
                {rank: 'Q', suit: 'd'},
                {rank: 'J', suit: 'h'},
                {rank: 'A', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.PAIR);
            hr.isValid().should.be.true;
        });

        it('should be valid for 9s 9d 4c 3h 2s', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '4', suit: 'd'},
                {rank: '3', suit: 'h'},
                {rank: '2', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.PAIR);
            hr.isValid().should.be.true;
        });

        it('should not be valid for 9s 9d 9c 9h 3s (Four of a Kind)', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '9', suit: 'd'},
                {rank: '9', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.PAIR);
            hr.isValid().should.be.false;
        });

        it('should not be valid for 9s 9d 4c 4h 4s (Full House)', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '4', suit: 'd'},
                {rank: '4', suit: 'h'},
                {rank: '4', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.PAIR);
            hr.isValid().should.be.false;
        });

        it('should not be valid for As 9d 5c 4h 3s (High Card)', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '5', suit: 'd'},
                {rank: '4', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.PAIR);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be a pair queens Qs Qd Jh Tc 2s', function(){
            var cards = [
                {rank: 'Q', suit: 's'},
                {rank: 'Q', suit: 'd'},
                {rank: 'J', suit: 'h'},
                {rank: 'T', suit: 'c'},
                {rank: '2', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.PAIR);
            hr.description.should.be.eql('a pair of queens');
        });

    });

});