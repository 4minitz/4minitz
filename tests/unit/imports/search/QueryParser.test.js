import proxyquire from 'proxyquire';
import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'underscore';

const {
    QueryParser
    } = proxyquire('../../../../imports/search/QueryParser', {
    'meteor/underscore': { _, '@noCallThru': true}
});

describe("QueryParser", function() {

    let parser;

    beforeEach(function() {
        parser = new QueryParser();
    });

    it("parses a simple query string containing only search tokens correctly", function() {
        const QUERY = "hello world";
        parser.parse(QUERY);
        let searchTokens = parser.getSearchTokens();
        let filterTokens = parser.getFilterTokens();

        expect(filterTokens, "should contain no filter tokens").to.have.length(0);
        expect(searchTokens, "should contain 2 search tokens").to.have.length(2);

        expect(searchTokens).to.contain('hello');
        expect(searchTokens).to.contain('world');
    });

    it("parses a simple query string containing search tokens and keywords correctly", function() {
        const QUERY = "hello is:open world";
        parser.parse(QUERY);
        let searchTokens = parser.getSearchTokens();
        let filterTokens = parser.getFilterTokens();

        expect(filterTokens, "should contain 1 filter tokens").to.have.length(1);
        expect(searchTokens, "should contain 2 search tokens").to.have.length(2);

        expect(searchTokens).to.contain('hello');
        expect(searchTokens).to.contain('world');
        expect(filterTokens).to.contain({key: 'is', value: 'open'});
    });

});