import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const {
    TopicFilter
    } = proxyquire('../../../imports/TopicFilter', {});

let QueryParserMock = function() { this.query = null};
QueryParserMock.prototype.parse = function(query) {
    this.query = query;
};
QueryParserMock.prototype.getSearchTokens = function() {
    return this.query.split(" ");
};
QueryParserMock.prototype.getFilterTokens = function() {
    return [];
};
QueryParserMock.prototype.getLabelTokens = function() {
    return [];
};
QueryParserMock.prototype.reset = function() {};

describe('TopicFilter', function() {

    let topics, topicFilter;

    beforeEach(function() {
        topicFilter = new TopicFilter(new QueryParserMock());
        topics = [
            {
                subject: "One",
                infoItems: [{subject: "one.one"}, {subject: "one.two"}]
            },
            {
                subject: "Two",
                infoItems: [{subject: "two.one"}, {subject: "two.two"}, {subject: "two.three"}]
            },
            {
                subject: "Three",
                infoItems: [{subject: "three.one"}, {subject: "three.two"}, {subject: "three.three"}, {subject: "three.four"}]
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

});