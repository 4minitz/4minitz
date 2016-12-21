import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';

const {
    KEYWORDS
    } = proxyquire('../../../imports/search/FilterKeywords', {
    'meteor/underscore': { _, '@noCallThru': true}
});

const {
    TopicFilter
    } = proxyquire('../../../imports/TopicFilter', {
    'meteor/underscore': { _, '@noCallThru': true},
    './search/FilterKeywords': { KEYWORDS, '@noCallThru': true}
});

let QueryParserMock = function() { this.query = null};
QueryParserMock.prototype.parse = function(query) {
    this.query = query;
};
QueryParserMock.prototype.getSearchTokens = function() {
    if (this.query.substr(0,1) === '#') {
        return [];
    }
    return this.query.split(" ");
};
QueryParserMock.prototype.getFilterTokens = function() {
    return [];
};
QueryParserMock.prototype.getLabelTokens = function() {
    if (this.query.substr(0,1) === '#') {
        let token = this.query.substr(1);
        return [{token: token, ids: [token]}];
    }
    return [];
};
let caseSensitive = false;
QueryParserMock.prototype.isCaseSensitive = function () { return caseSensitive; };
QueryParserMock.prototype.reset = function() {};

describe('TopicFilter', function() {

    let topics, topicFilter;

    beforeEach(function() {
        topicFilter = new TopicFilter(new QueryParserMock());
        topics = [
            {
                subject: "One",
                infoItems: [{subject: "one.one", labels: ['L2', 'L1']}, {subject: "one.two", labels: []}]
            },
            {
                subject: "Two",
                infoItems: [
                    {subject: "two.one", labels: ['L1']},
                    {subject: "two.two", labels: []},
                    {subject: "two.three", labels: ['L1']}
                ]
            },
            {
                subject: "Three",
                infoItems: [
                    {subject: "three.one", labels: []},
                    {subject: "three.two", labels: []},
                    {subject: "three.three", labels: []},
                    {subject: "three.four", labels: []}
                ]
            }
        ];
    });

    it('does not change the original array of topics', function() {
        topicFilter.filter(topics, "three");

        expect(topics, "Length of the topic array should be 3").have.length(3);
        expect(topics[0].infoItems, "The first topic should contain two info items").to.have.length(2);
        expect(topics[1].infoItems, "The 2nd topic should contain three info items").to.have.length(3);
        expect(topics[2].infoItems, "The 3rd topic should contain four info items").to.have.length(4);
    });

    it('returns the filtered array of topics', function() {
        let res = topicFilter.filter(topics, "three");

        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain four info items").to.have.length(4);
    });

    it('can filter for multiple search tokens', function() {
        let res = topicFilter.filter(topics, "three two");

        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain one info items").to.have.length(1);
    });

    it('should return an topics array containing only info items matching the search query', function() {
        const query = "three";
        let res = topicFilter.filter(topics, query);
        res.forEach(topic => {
            topic.infoItems.forEach(item => {
                if (item.subject.indexOf(query) === -1) {
                    fail("Result array contains info item which does not match the search query");
                }
            });
        })
    });

    it('can filter for labels', function() {
        const query = "#L1";
        let res = topicFilter.filter(topics, query);
        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain two info items").to.have.length(2);
    });

    it('filters case insensitive per default for search tokens', function() {
        let res = topicFilter.filter(topics, "THREE TWO");

        expect(res, "Length of the result topic array should be 2").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain one info items").to.have.length(1);
    });

    it('can enable case sensitive search', function() {
        caseSensitive = true;
        let res = topicFilter.filter(topics, "THREE");
        caseSensitive = false;

        expect(res, "Length of the result topic array should be 0").have.length(0);
    });

});