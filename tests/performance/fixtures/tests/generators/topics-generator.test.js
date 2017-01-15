let expect = require('chai').expect;

import { TopicsGenerator } from '../../generators/topics-generator';


describe('TopicsGenerator', function() {

    describe('#_generateANewTopic', function() {

        const CONFIG = {
            minutesCount: 1,
            topicsRange: {min: 3, max: 4},
            itemsRange: {min: 3, max: 7}
        };
        /** @type {TopicsGenerator} */
        let generator;

        beforeEach(function() {
            generator = new TopicsGenerator(CONFIG);
        });

        it('generates one topic with the correct amount of info items', function() {
            for(let i = 0; i < 100; i++) {
                let topic = generator._generateANewTopic();
                expect(topic.infoItems).to.have.length.below(CONFIG.itemsRange.max+1);
                expect(topic.infoItems).to.have.length.above(CONFIG.itemsRange.min-1);
            }
        });

    });

    describe('#_copyTopicsToSeries', function() {

        /** @type {TopicsGenerator} */
        let generator;

        beforeEach(function() {
            generator = new TopicsGenerator(undefined);
        });

        it('should copy the new list to the seriesTopicList omitting the open items', function() {
            generator.currentTopicList = [
                {
                    _id: '1',
                    infoItems: [{_id: '1.1'}, {_id: '1.2', isOpen: true}]
                },
                {
                    _id: '2',
                    isOpen: false,
                    infoItems: [{_id: '2.1'}, {_id: '2.2'}, {_id: '2.3', isOpen: false}]
                }
            ];
            generator._copyTopicsToSeries();
            expect(generator.seriesTopicList).to.have.length(2);
            expect(generator.seriesTopicList[0].infoItems).to.have.length(1);
            expect(generator.seriesTopicList[1].infoItems).to.have.length(3);
            expect(generator.seriesTopicIdIndexMap).to.have.all.keys('1', '2');

            expect(generator.seriesTopicList[0].isOpen).to.be.true;
            expect(generator.seriesTopicList[1].isOpen).to.be.false;
        });

        it('should append the existing seriesTopicsList', function() {
            generator.seriesTopicList = [
                {
                    _id: '1',
                    isOpen: true,
                    infoItems: [{_id: '1.1'}]
                },
                {
                    _id: '2',
                    isOpen: false,
                    infoItems: [{_id: '2.1'}, {_id: '2.2'}, {_id: '2.3', isOpen: false}]
                }
            ];
            generator.seriesTopicIdIndexMap = {'1': 0, '2': 1};
            generator.currentTopicList = [
                {
                    _id: '3',
                    isOpen: true,
                    infoItems: [{_id: '3.1'}]
                },
                {
                    _id: '1',
                    infoItems: [{_id: '1.2', isOpen: false}, {_id: '1.3'}, {_id: '1.4', isOpen: true}]
                }
            ];

            generator._copyTopicsToSeries();

            expect(generator.seriesTopicList).to.have.length(3);
            expect(generator.seriesTopicList[0].infoItems).to.have.length(3);
            expect(generator.seriesTopicList[1].infoItems).to.have.length(3);
            expect(generator.seriesTopicList[2].infoItems).to.have.length(1);
            expect(generator.seriesTopicIdIndexMap).to.have.all.keys('1', '2', '3');

            expect(generator.seriesTopicList[0].isOpen).to.be.true;
            expect(generator.seriesTopicList[1].isOpen).to.be.false;
            expect(generator.seriesTopicList[2].isOpen).to.be.true;
        })

    });

});