'use strict';

var assert = require("assert");
var should = require('should');

var Card = require('../lib/card');
var HandRanking = require('../lib/hand-ranking');
var Ranker = require('../lib/ranker');

describe('Ranker', function(){

    describe('input', function(){

        it('should except cards in regular format', function(){
            var cards = ['As', 'Ks', 'Qs', 'Js', 'Ts'];
            var result = Ranker.getHand(cards);
            result.ranking.should.eql(HandRanking.ROYAL_FLUSH);
        });

        it('should except cards in hand board format', function(){
            var cards = ['As', 'Ks'];
            var board = ['Qs', 'Js', 'Ts'];
            var result = Ranker.getHand(cards, board);
            result.ranking.should.eql(HandRanking.ROYAL_FLUSH);
        });

    });

    describe('evaluation', function(){

        it('should find Royal Flush for As Ks Qs Js Ts', function(){
            var cards = ['As', 'Ks', 'Qs', 'Js', 'Ts'];
            var result = Ranker.getHand(cards);
            result.ranking.should.eql(HandRanking.ROYAL_FLUSH);
        });

        it('should find Straight Flush for Ks Qs Js Ts 9s', function(){
            var cards = ['Ks', 'Qs', 'Js', 'Ts', '9s'];
            var result = Ranker.getHand(cards);
            result.ranking.should.eql(HandRanking.STRAIGHT_FLUSH);
        });

        it('should find Two Pair for Ks Kc Ts Tc 9s', function(){
            var cards = ['Ks', 'Kc', 'Ts', 'Tc', '9s'];
            var result = Ranker.getHand(cards);
            result.ranking.should.eql(HandRanking.TWO_PAIR);
        });

        it('should find Two Pair for Ks Kc Ts Tc 9s As', function(){
            var cards = ['Ks', 'Kc', 'Ts', 'Tc', '9s', 'As'];
            var result = Ranker.getHand(cards);
            result.playingCards[0].rank.should.eql('K');
            result.playingCards[1].rank.should.eql('K');
            result.playingCards[2].rank.should.eql('T');
            result.playingCards[3].rank.should.eql('T');
            result.playingCards[4].rank.should.eql('A');
        });

        it('should find Straight for Ks Kc Qs Qc Jd Td 9d 3s', function(){
            var cards = ['Ks', 'Kc', 'Qs', 'Qc', 'Jd', 'Td', '9d'];
            var result = Ranker.getHand(cards);
            result.ranking.should.eql(HandRanking.STRAIGHT);
        });

        it('should order hands correctly', function(){
            var hand1 = {id: 1,cards: ['As', 'Ks', 'Qs', 'Js', 'Ts', '3h', '2h']};
            var hand2 = {id: 2,cards: ['As', 'Ks', 'Qs', 'Js', '9c', '3h', '2h']};
            var hand3 = {id: 3,cards: ['4s', '4c', '4h', '2s', '2h', '3h', '2h']};
            var hand4 = {id: 4,cards: ['Ks', 'Kd', 'Kc', 'Kh', 'Ts', '3h', '2h']};
            var results = Ranker.orderHands([hand1, hand2, hand3, hand4]);

            results[0][0].id.should.eql(1);
            results[1][0].id.should.eql(4);
            results[2][0].id.should.eql(3);
            results[3][0].id.should.eql(2);
        });

        it('should tying hands together', function(){
            var hand1 = {id: 1, cards: ['Ac', '5c']}; // tie
            var hand2 = {id: 2, cards: ['Ad', '8d']}; // tie
            var hand3 = {id: 3, cards: ['Kh', 'Jc']}; // win
            var board = ['Th', '9h', 'Tc', '6c', 'Jh'];
            var hands = [hand1, hand2, hand3];
            var results = Ranker.orderHands(hands, board);

            results[0][0].id.should.eql(3);
            [1, 2].should.include(results[1][0].id);
            [1, 2].should.include(results[1][1].id);
        });

        it('should group tying hands together', function(){
            var hand1 = {id: 1, cards: ['Ac', 'Ah', 'Kd', '7d']}; // tie
            var hand2 = {id: 2, cards: ['Ad', 'As', 'Js', '5s']}; // tie
            var hand3 = {id: 3, cards: ['Tc', '9c', '3s', '2s']}; // win
            var board = ['Th', '9h', 'Tc', '6c', 'Jh'];
            var hands = [hand1, hand2, hand3];
            var results = Ranker.orderHands(hands, board, Ranker.OMAHA_HI);

            results[0][0].id.should.eql(3);
            [1, 2].should.include(results[1][0].id);
            [1, 2].should.include(results[1][1].id);
        });

    });

    describe('options', function(){

        describe('omaha', function(){

            it('should evaluate omaha correctly', function(){
                var cards = ['4c', '4s', '5h', '5c'];
                var board = ['Ts', '9s', '8s', '3h', '2h'];
                var result = Ranker.getHand(cards, board, Ranker.OMAHA_HI);
                result.ranking.should.eql(HandRanking.PAIR);
            });

            it('should evaluate omaha correctly', function(){
                var cards = ['As', 'Ks', 'Qs', 'Js'];
                var board = ['Ts', '9s', '8s'];
                var result = Ranker.getHand(cards, board, Ranker.OMAHA_HI);
                result.ranking.should.eql(HandRanking.STRAIGHT_FLUSH);
            });

            it('should order omaha hands correctly', function(){

                var board = ['Ts', '9s', '8s', '3h', '2h'];
                var hand1 = {id: 1, cards: ['As', 'Ks', 'Qs', 'Js']};
                var hand2 = {id: 2, cards: ['2s', '2c', '9c', '8c']};
                var hand3 = {id: 3, cards: ['4c', '4s', '5h', '5c']};
                var hand4 = {id: 4, cards: ['7s', '6s', '3c', '2c']};
                var hands = [hand1, hand2, hand3, hand4];
                var results = Ranker.orderHands(hands, board, Ranker.OMAHA_HI);

                results[0][0].id.should.eql(1);
                results[1][0].id.should.eql(4);
                results[2][0].id.should.eql(2);
                results[3][0].id.should.eql(3);
            });
        });

        describe('win type', function(){

            it('should evaluate razz hands correctly', function(){
                var hand1 = {id: 1, cards: ['3d', '6d', '7s', '2d', '8h', '9h', '5c']};
                var hand2 = {id: 2, cards: ['3c', '2c', '6c', '7h', '2h', '8s', '6s']};

                var results = Ranker.orderHands([hand1, hand2], Ranker.RAZZ);

                results[0][0].id.should.eql(1);
                results[0][0].playingCards[0].rank.should.eql(Card.RANK_SEVEN);
                results[1][0].id.should.eql(2);
                results[1][0].playingCards[0].rank.should.eql(Card.RANK_EIGHT);
            });

            it('should evaluate omahah hi/lo hands correctly', function(){
                var board = ['Kh', '3d', '4d', '8s', '2d'];
                var hand1 = {id: 1, cards: ['Ah', '2s', 'Qd', 'Ks']};
                var hand2 = {id: 2, cards: ['6h', '7h', 'Td', 'Jd']};

                var results = Ranker.orderHands([hand1, hand2], board, Ranker.OMAHA_HI_LO);
                results[Ranker.HIGH][0][0].id.should.eql(2);
                results[Ranker.HIGH][1][0].id.should.eql(1);

                results[Ranker.LOW][0][0].id.should.eql(2);
                results[Ranker.LOW][0][0].playingCards[0].rank.should.eql(Card.RANK_SEVEN);
                results[Ranker.LOW][0][0].playingCards[1].rank.should.eql(Card.RANK_SIX);
                results[Ranker.LOW][0][0].playingCards[2].rank.should.eql(Card.RANK_FOUR);
                results[Ranker.LOW][0][0].playingCards[3].rank.should.eql(Card.RANK_THREE);
                results[Ranker.LOW][0][0].playingCards[4].rank.should.eql(Card.RANK_TWO);

                results[Ranker.LOW][1][0].id.should.eql(1);
                results[Ranker.LOW][1][0].playingCards[0].rank.should.eql(Card.RANK_EIGHT);
                results[Ranker.LOW][1][0].playingCards[1].rank.should.eql(Card.RANK_FOUR);
                results[Ranker.LOW][1][0].playingCards[2].rank.should.eql(Card.RANK_THREE);
                results[Ranker.LOW][1][0].playingCards[3].rank.should.eql(Card.RANK_TWO);
                results[Ranker.LOW][1][0].playingCards[4].rank.should.eql(Card.RANK_ACE);
            });

            it('should evaluate seven card hi-lo correctly', function(){
                var hand1 = {id: 1, cards: ['Ah', '2s', 'Kh', 'Ks', '3c', '4h', '5d']};
                var hand2 = {id: 2, cards: ['As', '3s', 'Qh', 'Qd', 'Qs', '3h', '5c']};

                var results = Ranker.orderHands([hand1, hand2], Ranker.STUD_HI_LO);

                results[Ranker.HIGH][0][0].id.should.eql(2);
                results[Ranker.HIGH][1][0].id.should.eql(1);
                results[Ranker.LOW][0][0].id.should.eql(1);
                results[Ranker.LOW].length.should.eql(1);

            });
        });

        describe('only pairs count', function(){

            it('should evaluate 6s 5s 4s 3s 2s as a six high for DEUCE_TO_SIX', function(){
                var hand = ['6s', '5s', '4s', '3s', '2s'];
                var result = Ranker.getHand(hand, Ranker.DEUCE_TO_SIX);
                result.ranking.should.eql(HandRanking.HIGH_CARD);
            });

            it('should evaluate As 5s 4s 3s 2s as ace high for DEUCE_TO_SIX', function(){
                var hand = ['As', '5s', '4s', '3s', '2s'];
                var result = Ranker.getHand(hand, Ranker.DEUCE_TO_SIX);
                result.ranking.should.eql(HandRanking.HIGH_CARD);
                result.playingCards[0].rank.should.eql(Card.RANK_ACE);
            });

            it('should evaluate 5s 4s 3s 2s As as a straight flush for ACE_TO_SIX', function(){
                var hand = ['5s', '4s', '3s', '2s', 'As'];
                var result = Ranker.getHand(hand, Ranker.ACE_TO_SIX);
                result.ranking.should.eql(HandRanking.STRAIGHT_FLUSH);
                result.playingCards[0].rank.should.eql(Card.RANK_FIVE);
            });

        });

        describe('ace low', function(){

            it('should evaluate 5s 4s 3s 2s As as a five high for CALIFORNIA_LOWBALL', function(){
                var hand = ['5s', '4s', '3s', '2s', 'As'];
                var result = Ranker.getHand(hand, Ranker.CALIFORNIA_LOWBALL);
                result.ranking.should.eql(HandRanking.HIGH_CARD);
                result.playingCards[0].rank.should.eql(Card.RANK_FIVE);
            });


            it('should order CALIFORNIA_LOWBALL hands correctly', function(){
                var hand1 = {id: 1, cards: ['As', '6c', '4s', '3s', '2s']}; // win
                var hand2 = {id: 2, cards: ['7s', '5d', '4d', '3d', '2d']}; // lose

                var results = Ranker.orderHands([hand1, hand2], Ranker.CALIFORNIA_LOWBALL);

                results[0][0].id.should.eql(1);
                results[1][0].id.should.eql(2);
            });
        });

        describe('complex hands', function(){

            it('should evaluate omaha hi/lo hands correctly', function(){
                var board = ['7c', '6c', '2d', '5h', 'Ah'];
                var hand1 = {id: 1, cards: ['Jd', 'Js', 'Qd', 'Qs']};
                var hand2 = {id: 2, cards: ['Ad', '6h', 'Jc', '9c']};
                var hand3 = {id: 3, cards: ['7d', 'Qh', 'As', '2c']};
                var hand4 = {id: 4, cards: ['Tc', 'Kh', '9s', '9d']};
                var hands = [hand1, hand2, hand3, hand4];

                var results = Ranker.orderHands(hands, board, Ranker.OMAHA_HI_LO);
                results[Ranker.HIGH][0][0].id.should.eql(3);
                [2 , 3].should.include(results[Ranker.LOW][0][0].id);
                [2 , 3].should.include(results[Ranker.LOW][0][1].id);
            });

            it('should evaluate seven card stud hi/lo hands correctly', function(){
                var hand1 = {id: 1, cards: ['Js', '7d', '4c', '3c', 'Qc', '3s', 'Td']};
                var hand2 = {id: 2, cards: ['7h', '6h', 'Th', '9s', 'Ks', 'Kc', '4d']};
                var hand3 = {id: 3, cards: ['2s', 'Ah', '2d', '2c', '6s', 'Ts', 'Qd']};
                var hand4 = {id: 4, cards: ['5c', '4s', 'Ac', '3d', '8d', 'Jd', 'Jc']};
                var hand5 = {id: 5, cards: ['8h', 'Ad', '5h', '4h', '3h', '8c', '8s']};
                var hand6 = {id: 6, cards: ['As', 'Qs', 'Tc', 'Kh', 'Jh', '2h', '5s']};

                var hands = [hand1, hand2, hand3, hand4, hand5, hand6];

                var results = Ranker.orderHands(hands, Ranker.STUD_HI_LO);

                results[Ranker.HIGH][0][0].id.should.eql(6);

                [4 , 5].should.include(results[Ranker.LOW][0][0].id);
                [4 , 5].should.include(results[Ranker.LOW][0][1].id);
            });
        });
    });
});