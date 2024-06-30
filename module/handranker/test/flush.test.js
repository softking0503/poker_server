'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Flush', function(){

    describe('validation', function(){

        it('should be valid for As Qs Ts 5s 3s', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'T',suit: 's'},
                {rank: '5', suit: 's'},
                {rank: '3', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.isValid().should.be.true;
        });

        it('should be not valid for As 9d 8d 7d 6d (High Card)', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: '9', suit: 'd'},
                {rank: '8', suit: 'd'},
                {rank: '7', suit: 'd'},
                {rank: '6', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.isValid().should.be.false;
        });

        it('should be not valid for Td 9d 8d 7d 6d (Straight Flush)', function(){
            var cards = [
                {rank: 'T', suit: 'd'},
                {rank: '9', suit: 'd'},
                {rank: '8', suit: 'd'},
                {rank: '7', suit: 'd'},
                {rank: '6', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.isValid().should.be.false;
        });

        it('should be not valid for 5d 4d 3d 2d Ad (Straight Flush Wheel)', function(){
            var cards = [
                {rank: '5', suit: 'd'},
                {rank: '4', suit: 'd'},
                {rank: '3', suit: 'd'},
                {rank: '2', suit: 'd'},
                {rank: 'A', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be flush ace high for As Ks Qs Js 9s', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: '9', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.description.should.be.eql('flush ace high');
        });

        it('should be flush ten high for Ts 8s 5s 4s 3s', function(){
            var cards = [
                {rank: 'T', suit: 's'},
                {rank: '8', suit: 's'},
                {rank: '5', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: '3', suit: 's'}
            ];
            var hr = new HandRanking(cards, HandRanking.FLUSH);
            hr.description.should.be.eql('flush ten high');
        });

    });
});