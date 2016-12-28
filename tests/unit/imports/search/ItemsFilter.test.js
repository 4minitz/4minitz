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
    ItemsFilter
    } = proxyquire('../../../../imports/search/ItemsFilter', {
    'meteor/underscore': { _, '@noCallThru': true},
    './FilterKeywords': { ITEM_KEYWORDS, '@noCallThru': true}
});

import { QueryParserMock } from './QueryParserMock'

describe('ItemsFilter', function() {

    let items, itemsFilter, parser;

    beforeEach(function() {
        parser = new QueryParserMock();
        itemsFilter = new ItemsFilter();
        items = [
            {subject: "one.one", labels: ['L2', 'L1'], itemType: 'infoItem'},
            {subject: "one.two", labels: [], itemType: 'actionItem', isOpen:true},
            {subject: "two.one", labels: ['L1'], itemType: 'infoItem'},
            {subject: "two.two", labels: [], itemType: 'infoItem'},
            {subject: "two.three", labels: ['L1'], itemType: 'actionItem', isOpen:true},
            {subject: "three.one", labels: [], itemType: 'infoItem'},
            {subject: "three.two", labels: [], itemType: 'infoItem'},
            {subject: "three.three", labels: [], itemType: 'infoItem'},
            {subject: "three.four", labels: [], itemType: 'actionItem', isOpen:false}
        ];
    });

    it('does not change the original array of items', function() {
        parser.searchTokens.push("three");
        itemsFilter.filter(items, parser);

        expect(items, "Length of the items array should be 9").have.length(9);
    });

    it('returns the filtered array of items', function() {
        parser.searchTokens.push("three");
        let res = itemsFilter.filter(items, parser);

        expect(res, "Length of the result items array should be 5").have.length(5);
    });

    it('can filter for multiple search tokens', function() {
        parser.searchTokens.push("three");
        parser.searchTokens.push("two");
        let res = itemsFilter.filter(items, parser);

        expect(res, "Length of the result items array should be 2").have.length(2);
    });

    it('should return an items array containing only info items matching the search query', function() {
        const query = "three";
        parser.searchTokens.push(query);
        let res = itemsFilter.filter(items, parser);
        let foundAWrongItem = false;
        res.forEach(item => {
            if (item.subject.indexOf(query) === -1) {
                foundAWrongItem = true;
            }
        });
        expect(foundAWrongItem, "Result array contains info item which does not match the search query").to.be.false;
    });

    it('can filter for labels', function() {
        parser.labelTokens.push("L1");
        let res = itemsFilter.filter(items, parser);
        expect(res, "Length of the result items array should be 3").have.length(3);
    });

    it('filters case insensitive per default for search tokens', function() {
        parser.searchTokens.push("THREE");
        parser.searchTokens.push("TWO");
        let res = itemsFilter.filter(items, parser);

        expect(res, "Length of the result items array should be 2").have.length(2);
    });

    it('can enable case sensitive search', function() {
        parser.caseSensitive = true;
        parser.searchTokens.push("THREE");
        let res = itemsFilter.filter(items, parser);
        parser.caseSensitive = false;

        expect(res, "Length of the result items array should be 0").have.length(0);
    });

    it('can combine multiple is-filter-tokens as logical AND which is a conjunctive operation', function() {
        parser.filterTokens.push({key: 'is', value: 'open'});
        parser.filterTokens.push({key: 'is', value: 'action'});
        let res = itemsFilter.filter(items, parser);

        expect(res, "Length of the result items array should be 2").have.length(2);

        parser.init();
        parser.filterTokens.push({key: 'is', value: 'action'});
        parser.filterTokens.push({key: 'is', value: 'open'});
        let res2 = itemsFilter.filter(items, parser);

        expect(res2, "The order of the filter tokens should not matter").have.length(2);
    });

});