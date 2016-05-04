import { should } from 'meteor/practicalmeteor:chai';
should();

import '/lib/helpers.js';

describe('formatDateISO8601 helper', function () {
    it('formats date to string', function () {
        formatDateISO8601(new Date(2016,11,23)).should.equal('2016-12-23');
    });
});

describe('currentDatePlusDeltaDays helper', function () {
    it('works without parameter', function () {
        var currentDate = new Date();

        currentDatePlusDeltaDays().should.equal(formatDateISO8601(currentDate));
    });

    it('works with zero offset', function () {
        var currentDate = new Date();

        currentDatePlusDeltaDays(0).should.equal(formatDateISO8601(currentDate));
    });

    it('works with positive offset', function () {
        var currentDate = new Date();
        var nextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+1);

        currentDatePlusDeltaDays(1).should.equal(formatDateISO8601(nextDay));
    });

    it('works with negative offset', function () {
        var currentDate = new Date();
        var nextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()-35);

        currentDatePlusDeltaDays(-35).should.equal(formatDateISO8601(nextDay));
    });
});