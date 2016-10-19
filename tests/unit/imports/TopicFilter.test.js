import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const {
    TopicFilter
    } = proxyquire('../../../imports/TopicFilter', {});

describe('TopicFilter', function() {

    let topics;

    beforeEach(function() {
        topics = [
            {
                subject: "One",
                infoItems: [{subject: "One.one"}, {subject: "One.two"}]
            },
            {
                subject: "Two",
                infoItems: [{subject: "Two.one"}, {subject: "Two.two"}, {subject: "Two.three"}]
            },
            {
                subject: "Three",
                infoItems: [{subject: "Three.one"}, {subject: "Three.two"}, {subject: "Three.three"}, {subject: "Three.four"}]
            }
        ];
    });

    it('does not change the original array of topics', function() {
        TopicFilter.filter(topics, "three");

        expect(topics, "Length of the topic array should be 3").have.length(3);
        expect(topics[0].infoItems, "The first topic should contain two info items").to.have.length(2);
        expect(topics[1].infoItems, "The 2nd topic should contain three info items").to.have.length(3);
        expect(topics[2].infoItems, "The 3rd topic should contain four info items").to.have.length(4);
    });

    it('returns the filtered array of topics', function() {
        let res = TopicFilter.filter(topics, "three");

        expect(res, "Length of the result topic array should be 3").have.length(2);
        expect(res[0].infoItems, "The first topic should contain one info items").to.have.length(1);
        expect(res[1].infoItems, "The 2nd topic should contain one info items").to.have.length(1);
    });

    it('should return an topics array containing only info items matching the search query', function() {
        const query = "three";
        let res = TopicFilter.filter(topics, query);
        res.forEach(topic => {
            topic.infoItems.forEach(item => {
                if (item.subject.indexOf(query) === -1) {
                    fail("Result array contains info item which does not match the search query");
                }
            });
        })
    });

});