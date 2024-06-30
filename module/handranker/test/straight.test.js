'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Straight', function(){

    describe('validation', function(){

        it('should be valid for Ts 9s 8d 7d 6d', function(){
            var cards = [
                {rank: 'T', suit: 's'},
                {rank: '9', suit: 's'},
                {rank: '8', suit: 'd'},
                {rank: '7', suit: 'd'},
                {rank: '6', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
            hr.isValid().should.be.true;
        });

        it('should be valid for 5s 4s 3d 2d Ad (Wheel)', function(){
            var cards = [
                {rank: '5', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: '3', suit: 'd'},
                {rank: '2', suit: 'd'},
                {rank: 'A', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
            hr.isValid().should.be.true;
        });

        it('should be not valid for Js 9s 8d 7d 6d (High Card)', function(){
            var cards = [
                {rank: 'J', suit: 's'},
                {rank: '9', suit: 's'},
                {rank: '8', suit: 'd'},
                {rank: '7', suit: 'd'},
                {rank: '6', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
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
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
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
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be straight ace high for As Ks Qs Js Tc', function(){
            var cards = [
                {rank: 'A', suit: 's'},
                {rank: 'K', suit: 's'},
                {rank: 'Q', suit: 's'},
                {rank: 'J', suit: 's'},
                {rank: 'T', suit: 'c'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
            hr.description.should.be.eql('straight ace high');
        });

        it('should be straight five high for 5s 4s 3s 2s Ac', function(){
            var cards = [
                {rank: '5', suit: 's'},
                {rank: '4', suit: 's'},
                {rank: '3', suit: 's'},
                {rank: '2', suit: 's'},
                {rank: 'A', suit: 'c'}
            ];
            var hr = new HandRanking(cards, HandRanking.STRAIGHT);
            hr.description.should.be.eql('straight five high');
        });

    });

});