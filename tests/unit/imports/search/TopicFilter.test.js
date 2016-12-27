import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';

const {
    ITEM_KEYWORDS
    } = proxyquire('../../../../imports/search/FilterKeywords', {
    'meteor/underscore': { _, '@noCallThru': true}
});

const {
    TopicFilter
    } = proxyquire('../../../../imports/search/TopicFilter', {
    'meteor/underscore': { _, '@noCallThru': true},
    './search/FilterKeywords': { ITEM_KEYWORDS, '@noCallThru': true}
});

class QueryParserMock {
    constructor() {
        this.init();
    }
    init() {
        this.caseSensitive = false;
        this.searchTokens = [];
        this.filterTokens = [];
        this.labelTokens = [];
    }
    reset() {
        // do nothing here, because this will be called before calling the parse method
    }

    parse() {}
    getSearchTokens() {
        return this.searchTokens;
    }
    getFilterTokens() {
        return this.filterTokens
    }
    getLabelTokens() {
        return this.labelTokens.map(token => { return {token: token, ids: [token]}; });
    }
    hasKeyword() {
        return true;
    }
    isCaseSensitive() { return this.caseSensitive }
}

describe('TopicFilter', function() {

    let topics, topicFilter, parser;

    beforeEach(function() {
        parser = new QueryParserMock();
        topicFilter = new TopicFilter(parser);
        topics = [
            {
                subject: "One",
                infoItems: [
                    {subject: "one.one", labels: ['L2', 'L1'], itemType: 'infoItem'},
                    {subject: "one.two", labels: [], itemType: 'actionItem', isOpen:true}
                ]
            },
            {
                subject: "Two",
                infoItems: [
                    {subject: "two.one", labels: ['L1'], itemType: 'infoItem'},
                    {subject: "two.two", labels: [], itemType: 'infoItem'},
                    {subject: "two.three", labels: ['L1'], itemType: 'actionItem', isOpen:true}
                ]
            },
            {
                subject: "Three",
                infoItems: [
                    {subject: "three.one", labels: [], itemType: 'infoItem'},
                    {subject: "three.two", labels: [], itemType: 'infoItem'},
                    {subject: "three.three", labels: [], itemType: 'infoItem'},
                    {subject: "three.four", labels: [], itemType: 'actionItem', isOpen:false}
                ]
            }
        ];
    });

    it('does not change the original array of topics', function() {
        parser.searchTokens.push("three");
        topicFilter.filter(topics, "");

        expect(topics, "Length of the topic array should be 3").have.length(3);
        expect(topics[0].infoItems, "The first topic should contain two info items").to.have.length(2);
        expect(topics[1].infoItems, "The 2nd topic should contain three info items").to.have.length(3);
        expect(topics[2].infoItems, "The 3rd topic should contain four info items").to.have.length(4);
    });

    it('returns the filtered array of topics', function() {
        parser.searchTokens.push("three");
        let res = topicFilter.filter(topics, "");

        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain four info items").to.have.length(4);
    });

    it('can filter for multiple search tokens', function() {
        parser.searchTokens.push("three");
        parser.searchTokens.push("two");
        let res = topicFilter.filter(topics, "");

        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain one info items").to.have.length(1);
    });

    it('should return an topics array containing only info items matching the search query', function() {
        const query = "three";
        parser.searchTokens.push(query);
        let res = topicFilter.filter(topics, query);
        let foundAWrongItem = false;
        res.forEach(topic => {
            topic.infoItems.forEach(item => {
                if (item.subject.indexOf(query) === -1) {
                    foundAWrongItem = true;
                }
            });
        });
        expect(foundAWrongItem, "Result array contains info item which does not match the search query").to.be.false;
    });

    it('can filter for labels', function() {
        parser.labelTokens.push("L1");
        let res = topicFilter.filter(topics, "");
        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain two info items").to.have.length(2);
    });

    it('filters case insensitive per default for search tokens', function() {
        parser.searchTokens.push("THREE");
        parser.searchTokens.push("TWO");
        let res = topicFilter.filter(topics, "");

        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain one info items").to.have.length(1);
    });

    it('can enable case sensitive search', function() {
        parser.caseSensitive = true;
        parser.searchTokens.push("THREE");
        let res = topicFilter.filter(topics, "");
        parser.caseSensitive = false;

        expect(res, "Length of the result topic array should be 0").have.length(0);
    });

    it('can combine multiple is-filter-tokens as logical and which is a conjunctive operation', function() {
        parser.filterTokens.push({key: 'is', value: 'open'});
        parser.filterTokens.push({key: 'is', value: 'action'});
        let res = topicFilter.filter(topics, "");

        expect(res, "Length of the result topic array should be 2").have.length(2);

        parser.init();
        parser.filterTokens.push({key: 'is', value: 'action'});
        parser.filterTokens.push({key: 'is', value: 'open'});
        let res2 = topicFilter.filter(topics, "");

        expect(res2, "The order of the filter tokens should not matter").have.length(2);
    });

});