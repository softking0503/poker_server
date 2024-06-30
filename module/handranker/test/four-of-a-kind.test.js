'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');

describe('Four of a Kind', function(){

    describe('validation', function(){

        it('should be valid for Ks Kd Kc Kh As', function(){
            var cards = [
                {rank: 'K', suit: 's'},
                {rank: 'K', suit: 'c'},
                {rank: 'K', suit: 'd'},
                {rank: 'K', suit: 'h'},
                {rank: 'A', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FOUR_OF_A_KIND);
            hr.isValid().should.be.true;
        });

        it('should be valid for 9s 9d 9c 9h 3s', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '9', suit: 'c'},
                {rank: '9', suit: 'd'},
                {rank: '9', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FOUR_OF_A_KIND);
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
            var hr = new HandRanking(cards, HandRanking.FOUR_OF_A_KIND);
            hr.isValid().should.be.false;
        });

        it('should not be valid for 9s 8d 7c 4h 3s (High Card)', function(){
            var cards = [
                {rank: '9', suit: 's'},
                {rank: '8', suit: 'c'},
                {rank: '7', suit: 'd'},
                {rank: '4', suit: 'h'},
                {rank: '3', suit: 'd'}
            ];
            var hr = new HandRanking(cards, HandRanking.FOUR_OF_A_KIND);
            hr.isValid().should.be.false;
        });
    });

    describe('description', function(){

        it('should be four of a kind queens for Qs Qd Qc Qh Js', function(){
            var cards = [
                {rank: 'Q', suit: 's'},
                {rank: 'Q', suit: 'd'},
                {rank: 'Q', suit: 'h'},
                {rank: 'Q', suit: 'c'},
                {rank: 'J', suit: 'c'}
            ];
            var hr = new HandRanking(cards, HandRanking.FOUR_OF_A_KIND);
            hr.description.should.be.eql('four of a kind queens');
        });

    });

});