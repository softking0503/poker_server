'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Straight Flush', function(){

    describe('validation', function(){

        it('should be valid for Js Ts 9s 8s 7s', function(){
            var cards = [
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'},
                {rank: '9', suit: 's'},
                {rank: '8', suit: 's'},
                {rank: '7', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT_FLUSH);
            hr.isValid().should.be.true;
        });

        it('should be valid for 5s 4s 3d 2d Ad (Straight Flush Wheel)', function(){
            var cards = [
                {rank: '5', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: '3', suit: 's'},
                {rank: '2', suit: 's'},
                {rank: 'A', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT_FLUSH);
            hr.isValid().should.be.true;
        });

        it('should not be valid for As Ks Qs Js Ts (Royal Flush)', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T',suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT_FLUSH);
            hr.isValid().should.be.false;
        });

        it('should be not valid for As Ks Qs Js Ts (Flush)', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: '9', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT_FLUSH);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be straight flush king high for Ks Qs Js Ts 9s', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 's'},
                {rank: '9', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT_FLUSH);
            hr.description.should.be.eql('straight flush king high');
        });

    });

});