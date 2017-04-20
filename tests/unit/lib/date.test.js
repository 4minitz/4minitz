import { expect } from 'chai';
import { formatDateISO8601, currentDatePlusDeltaDays } from '../../../imports/helpers/date';

describe('formatDateISO8601 helper', function () {
    it('formats date to string', function () {
        expect(formatDateISO8601(new Date(2016,11,23))).to.equal('2016-12-23');
    });
});

describe('currentDatePlusDeltaDays helper', function () {
    it('works without parameter', function () {
        var currentDate = new Date();

        expect(currentDatePlusDeltaDays()).to.equal(formatDateISO8601(currentDate));
    });

    it('works with zero offset', function () {
        var currentDate = new Date();

        expect(currentDatePlusDeltaDays(0)).to.equal(formatDateISO8601(currentDate));
    });

    it('works with positive offset', function () {
        var currentDate = new Date();
        var nextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+1);

        expect(currentDatePlusDeltaDays(1)).to.equal(formatDateISO8601(nextDay));
    });

    it('works with negative offset', function () {
        var currentDate = new Date();
        var nextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()-35);

        expect(currentDatePlusDeltaDays(-35)).to.equal(formatDateISO8601(nextDay));
    });
});
