'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Three of a Kind', function(){

    describe('validation', function(){

        it('should be valid for Ks Kd Kc Ah Js', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'K', suit: 'c'},
                {rank: 'K', suit: 'd'},
                {rank: 'A', suit: 'h'},
                {rank: 'J', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.THREE_OF_A_KIND);
            hr.isValid().should.be.true;
        });

        it('should be valid for 9s 9d 9c 5h 3s', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '9', suit: 'd'},
                {rank: '5', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.THREE_OF_A_KIND);
            hr.isValid().should.be.true;
        });

        it('should not be valid for 9s 9d 9c 3h 3s (Full House)', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '9', suit: 'd'},
                {rank: '3', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.THREE_OF_A_KIND);
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
            var hr = new HandRanking(cards, HandRanking.THREE_OF_A_KIND);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be three of a kind sixes for 6s 6d 6h Ah Js', function(){
            var cards = [
                {rank: '6', suit: 's'},
                {rank: '6', suit: 'd'},
                {rank: '6', suit: 'h'},
                {rank: 'A', suit: 'h'},
                {rank: 'J', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.THREE_OF_A_KIND);
            hr.description.should.be.eql('three of a kind sixes');
        });

    });

});