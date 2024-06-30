'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Full House', function(){

    describe('validation', function(){

        it('should be valid for Ks Kd Kc Ah As', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'K', suit: 'c'},
                {rank: 'K', suit: 'd'},
                {rank: 'A', suit: 'h'},
                {rank: 'A', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FULL_HOUSE);
            hr.isValid().should.be.true;
        });

        it('should be valid for 9s 9d 9c 3h 3s', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '9', suit: 'd'},
                {rank: '3', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FULL_HOUSE);
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
            var hr = new HandRanking(cards, HandRanking.FULL_HOUSE);
            hr.isValid().should.be.false;
        });

        it('should not be valid for 9s 9d 4c 4h 3s (Two Pair)', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '4', suit: 'd'},
                {rank: '4', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FULL_HOUSE);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be full house queens full of jacks for Qs Qd Qh Jh Js', function(){
            var cards = [
                {rank: 'Q', suit: 's'},
                {rank: 'Q', suit: 'd'},
                {rank: 'Q', suit: 'h'},
                {rank: 'J', suit: 'h'},
                {rank: 'J', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.FULL_HOUSE);
            hr.description.should.be.eql('full house queens full of jacks');
        });

    });

});