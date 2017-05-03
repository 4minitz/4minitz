import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

require('../../../../imports/helpers/date');

const FIRST_MIN_ID = '#Min01';
const SND_MIN_ID = '#Min02';

let MinutesCollection = {
    update: sinon.stub()
};
let MeetingSeriesCollection = {
    update: sinon.stub()
};

const {
        MigrateV12
    } = proxyquire('../../../../server/migrations/migrate_v12', {
        '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true},
    '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true}
    });

describe('Migrate Version 12', function () {

    let firstFakeMinute, sndFakeMinute, fakeMeetingSeries;

    beforeEach(function () {
        sndFakeMinute = {
            _id: SND_MIN_ID,
            topics: [{
                _id: '#T01',
                infoItems:[{
                    _id: '#I01',
                    details: [{text: 'd1'}, {text:'d2'}]
                },{
                    _id: '#I02',
                    details: [{text: 'd3'}, {text:'d4'}]
                }]
            }, {
                _id: '#T02',
                infoItems:[{
                    _id: '#I03',
                    details: [{text: 'd5'}]
                }]
            }],
            nextMinutes: () => {
                return false;
            },
            previousMinutes : () => {
                return firstFakeMinute;
            }
        };

        firstFakeMinute = {
            _id: FIRST_MIN_ID,
            topics: [{
                _id: '#T01',
                infoItems:[{
                    _id: '#I01',
                    details: [{text: 'd1'}, {text:'d22'}]
                },{
                    _id: '#I02',
                    details: [{text: 'd3'}, {text:'d4'}]
                }]
            }],
            nextMinutes: () => {
                return sndFakeMinute;
            },
            previousMinutes: () => {
                return false;
            }
        };

        fakeMeetingSeries = {
            _id: '#MS01',
            topics: [{
                _id: '#T01'
            }, {
                _id: '#T02'
            }],
            openTopics: [{
                _id: '#T02'
            }, {
                _id: '#T01'
            }],
            firstMinutes: () => {
                return firstFakeMinute;
            }
        };

        MeetingSeriesCollection.find = () => {
            return [fakeMeetingSeries];
        };

        MinutesCollection.find = () => {
            return [firstFakeMinute, sndFakeMinute];
        };
    });

    afterEach(function () {
        MinutesCollection.update.reset();
        MeetingSeriesCollection.update.reset();
    });

    describe('#up', function () {

        let checkDetailHasProperty_createdInMinute = detail => {
            expect(detail).to.have.ownProperty('createdInMinute');
        };

        let checkDetailHasProperty_id = detail => {
            expect(detail).to.have.ownProperty('_id');
        };

        it('sets the createdInMinutes and _id attribute for all topics in all minutes', function() {
            MigrateV12.up();
            firstFakeMinute.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasProperty_createdInMinute);
                    infoItem.details.forEach(checkDetailHasProperty_id);
                })
            });
            /*sndFakeMinute.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasProperty_createdInMinute);
                    infoItem.details.forEach(checkDetailHasProperty_id);
                })
            });*/
        });

        /*it('sets the createdInMinutes and _id attribute for all topics in the meeting series', function() {
            MigrateV12.up();
            fakeMeetingSeries.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasProperty_createdInMinute);
                    infoItem.details.forEach(checkDetailHasProperty_id);
                })
            });
            fakeMeetingSeries.openTopics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasProperty_createdInMinute);
                    infoItem.details.forEach(checkDetailHasProperty_id);
                })
            });
        });

        it('sets the correct id for the createdInMinute-attribute', function() {
            MigrateV12.up();
            // detail created in minute in 1 minute
            expect(firstFakeMinute.topics[0].infoItems[0].details[0].createdInMinute).to.equal(FIRST_MIN_ID);
            // detail created in 1 minute => in 2. minute
            expect(sndFakeMinute.topics[0].infoItems[0].details[0].createdInMinute).to.equal(FIRST_MIN_ID);
            expect(fakeMeetingSeries.topics[0].infoItems[0].details[0].createdInMinute).to.equal(FIRST_MIN_ID);
            expect(fakeMeetingSeries.openTopics[1].infoItems[0].details[0].createdInMinute).to.equal(FIRST_MIN_ID);

            expect(sndFakeMinute.topics[1].infoItems[0].details[0].createdInMinute).to.equal(SND_MIN_ID);
            expect(fakeMeetingSeries.topics[1].infoItems[0].details[0].createdInMinute).to.equal(SND_MIN_ID);
            expect(fakeMeetingSeries.openTopics[0].infoItems[0].details[0].createdInMinute).to.equal(SND_MIN_ID);

            expect(firstFakeMinute.topics[0].infoItems[0].details[1].createdInMinute).to.equal(FIRST_MIN_ID);
            //detail was changed in 2nd minute
            expect(sndFakeMinute.topics[0].infoItems[0].details[1].createdInMinute).to.equal(SND_MIN_ID);

        });*/

    });

    describe('#down', function () {

        beforeEach(function() {
            let addCreatedInMinuteFakeAttribute = (topic) => {
                topic.createdInMinute = 'fakeID';
            };
            firstFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
            sndFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
            fakeMeetingSeries.topics.forEach(addCreatedInMinuteFakeAttribute);
            fakeMeetingSeries.openTopics.forEach(addCreatedInMinuteFakeAttribute);
        });

       /* it('removes the createdInMinute-attribute', function() {
            MigrateV12.down();

            let checkDetailHasNoAttribute_createdInMinute = detail => {
                expect(detail).not.have.ownProperty('createdInMinute');
            };
            let checkDetailHasNoAttribute_id = detail => {
                expect(detail).not.have.ownProperty('_id');
            };

            firstFakeMinute.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasNoAttribute_createdInMinute);
                    infoItem.details.forEach(checkDetailHasNoAttribute_id);
                })
            });
            sndFakeMinute.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasNoAttribute_createdInMinute);
                    infoItem.details.forEach(checkDetailHasNoAttribute_id);
                })
            });
            fakeMeetingSeries.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasNoAttribute_createdInMinute);
                    infoItem.details.forEach(checkDetailHasNoAttribute_id);
                })
            });
            fakeMeetingSeries.topics.forEach(topic =>{
                topic.infoItems.forEach(infoItem =>{
                    infoItem.details.forEach(checkDetailHasNoAttribute_createdInMinute);
                    infoItem.details.forEach(checkDetailHasNoAttribute_id);
                })
            });
        });*/

    });

});
