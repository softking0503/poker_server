'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Pair', function(){

    describe('validation', function(){

        it('should be valid for As Kd Qc Jh 2s', function(){
            var cards = [
                {rank: '2', suit: 's'},
                {rank: 'K', suit: 'c'},
                {rank: 'Q', suit: 'd'},
                {rank: 'J', suit: 'h'},
                {rank: 'A', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD);
            hr.isValid().should.be.true;
        });

        it('should be valid for 7s 5d 4c 3h 2s', function(){
            var cards = [
                {rank: '7', suit: 's'},
                {rank: '5', suit: 'c'},
                {rank: '4', suit: 'd'},
                {rank: '3', suit: 'h'},
                {rank: '2', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD);
            hr.isValid().should.be.true;
        });

        it('should not be valid for As Ks Qs Js Ts (Royal Flush)', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD);
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
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD);
            hr.isValid().should.be.false;
        });

        it('should not be valid for As Ad 5c 4h 3s (Pair)', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'A', suit: 'c'},
                {rank: '5', suit: 'd'},
                {rank: '4', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be queen high Qs Jd 9h 8c 2s', function(){
            var cards = [
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 'd'},
                {rank: '9', suit: 'h'},
                {rank: '8', suit: 'c'},
                {rank: '2', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.HIGH_CARD);
            hr.description.should.be.eql('queen high');
        });

    });

});