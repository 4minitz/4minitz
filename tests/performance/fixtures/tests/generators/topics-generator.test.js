let expect = require('chai').expect;

import { TopicsGenerator } from '../../generators/topics-generator';


describe('TopicsGenerator', function() {

    describe('#generateNextListForMinutes', function() {

        const CONFIG = {
            topicsRange: {min: 3, max: 4},
            itemsRange: {min: 3, max: 10},
            detailsSentenceRange: {min: 7, max: 23}
        };
        /** @type {TopicsGenerator} */
        let generator;

        beforeEach(function() {
            generator = new TopicsGenerator(CONFIG);
        });

        it('should not modify the previously returned topics array', function() {
            let firstTopicList = generator.generateNextListForMinutes('a'); // all AIs of this list should be open!
            generator.generateNextListForMinutes('a');

            firstTopicList.forEach(topic => {
                topic.infoItems.forEach(item => {
                    expect(item.itemType === 'infoItem' || item.isOpen).to.be.true;
                })
            })
        });

    });

    describe('#_generateANewTopic', function() {

        const CONFIG = {
            topicsRange: {min: 3, max: 4},
            itemsRange: {min: 3, max: 7},
            detailsSentenceRange: {min: 7, max: 23}
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

    describe('#_extendExistingTopics', function() {

        const CONFIG = {
            topicsRange: {min: 3, max: 4},
            itemsRange: {min: 7, max: 20}
        };
        /** @type {TopicsGenerator} */
        let generator;

        beforeEach(function() {
            generator = new TopicsGenerator(CONFIG);
        });

        it('should not toggle new generated action items', function() {
            // mock generator
            let nextId = 16;
            generator._generateANewInfoItem = () => {
                let id = '1.' + nextId++;
                return {_id: id, itemType: 'actionItem', isOpen: true}
            };

            generator.currentTopicList = [
                {
                    _id: '1',
                    infoItems: [
                        {_id: '1.1', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.2', itemType: 'infoItem', details: []},
                        {_id: '1.3', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.4', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.5', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.6', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.7', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.8', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.9', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.10', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.11', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.12', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.13', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.14', isOpen: true, itemType: 'actionItem', details: []},
                        {_id: '1.15', isOpen: true, itemType: 'actionItem', details: []}
                    ]
                }
            ];

            generator._extendExistingTopics();

            for (let i = 0; i < generator.currentTopicList[0].infoItems.length - 15; i++) {
                expect(generator.currentTopicList[0].infoItems[i].isOpen, `${i}. item should be open, too`).to.be.true;
            }
        });

    });

});