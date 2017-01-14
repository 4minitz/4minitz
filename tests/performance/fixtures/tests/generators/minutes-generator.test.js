let expect = require('chai').expect;

import { MinutesGenerator } from '../../generators/minutes-generator';


describe('MinutesGenerator', function() {

    describe('generate', function() {

        const DUMMY_USER = {
            _id: 'userId',
            username: 'username'
        };
        const DATE = new Date('2016-08-01');

        it('should generate the correct amount of minutes', function() {
            let config = {
                minutesCount: 5
            };
            let generator = new MinutesGenerator(config, null, DUMMY_USER, DATE);
            expect(generator.generate()).to.have.length(config.minutesCount);
        });

        it('should set all minutes as finalized except the last one', function() {
            let config = {
                minutesCount: 5
            };
            let generator = new MinutesGenerator(config, null, DUMMY_USER, DATE);
            let res = generator.generate();
            res.forEach((m, i) => {
                let isLastOne = (i+1 === config.minutesCount);
                if (!isLastOne) {
                    expect(m.isFinalized, 'not-last element should be finalized').to.be.true;
                } else {
                    expect(m.isFinalized, 'last element should not be finalized').to.be.false;
                }
            })
        });

        it('should generate minutes at increasing dates', function() {
            let config = {
                minutesCount: 5
            };
            let generator = new MinutesGenerator(config, null, DUMMY_USER, DATE);
            let res = generator.generate();
            let expectedDate = DATE;
            res.forEach((m) => {
                expect(m.date).equal(MinutesGenerator._formatDate(expectedDate));
                expectedDate.setDate(expectedDate.getDate() + 1);
            })
        });

    });

    describe('#_formatDate', function() {

        it('should format a date correctly', function() {
            const DATE_STR = '2016-08-26';
            let formattedDate = MinutesGenerator._formatDate(new Date(DATE_STR));
            expect(formattedDate).to.equal(DATE_STR);
        });

    });

    describe('#_tickOneDay', function() {

        it('should increase the next minutes date by one day', function() {
            let generator = new MinutesGenerator(null, null, null, new Date('2016-08-26'));
            generator._tickOneDay();
            expect(MinutesGenerator._formatDate(generator.nextMinutesDate)).to.equal('2016-08-27');
        });

        it('should increase the month if necessary', function() {
            let generator = new MinutesGenerator(null, null, null, new Date('2016-01-31'));
            generator._tickOneDay();
            expect(MinutesGenerator._formatDate(generator.nextMinutesDate)).to.equal('2016-02-01');
        });

    });

});