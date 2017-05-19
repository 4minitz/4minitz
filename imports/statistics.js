import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { MinutesCollection } from './collections/minutes_private';
import { MeetingSeriesCollection } from './collections/meetingseries_private';
import { Attachment } from './attachment';

let StatisticsCollection = new Mongo.Collection('statistics');

if (Meteor.isServer) {
    Meteor.publish('statistics', function () {
        return StatisticsCollection.find();
    });
}
if (Meteor.isClient) {
    Meteor.subscribe('statistics');
}

const StatisticsRow = SchemaClass.create({
    name: 'StatisticsRow',
    fields: {
        description: {type: String},
        value: {type: String}
    }
});

export const Statistics = SchemaClass.create({
    name: 'Statistics',
    collection: StatisticsCollection,
    fields: {
        result: {type: [StatisticsRow]}
    },
    meteorMethods: {
        update() {
            const numberOfMeetingSeries = MeetingSeriesCollection.find().count(),
                numberOfMinutes = MinutesCollection.find().count(),
                numberOfUsers = Meteor.users.find().count(),
                numberOfActiveUsers = Meteor.users.find({$or: [{isInactive: { $exists: false }}, {isInactive: false}]}).count(),
                numberOfAttachments = Attachment.countAll(),
                numberOfAttachmentMB = Math.floor(Attachment.countAllBytes() / 1024 / 1024)+ ' MB';

            StatisticsCollection.remove({});

            let statistics = this;
            statistics.result = [{
                description: 'Number of users (active)',
                value: numberOfUsers + ' (' + numberOfActiveUsers + ')'
            }, {
                description: 'Number of meeting series',
                value: numberOfMeetingSeries.toString()
            }, {
                description: 'Number of meeting minutes',
                value: numberOfMinutes.toString()
            }, {
                description: 'Number of attachments',
                value: numberOfAttachments.toString()
            }, {
                description: 'Attachments size',
                value: numberOfAttachmentMB.toString()
            }];

            statistics.save();
        }
    }
});


// Generate some statistics for non-testing meeting series.
// logs results to console
// @param minTopicsCount {Number} only meeting series with at least so much minutes are considered
// @param minTopicsCount {Number} only meeting series with at least so much finalized topics are considered
let statisticsDetails = function (minMinutesCount = 2, minTopicsCount = 5) {
    let MS = MeetingSeriesCollection.find();
    let MScount = 0;
    let MinutesCount = 0;
    let TopicCount = 0;
    let TopicMax = 0;
    let ItemCount = 0;
    let ItemMax = 0;
    let DetailCount = 0;
    let DetailMax = 0;

    MS.forEach(ms => {
        if (ms.minutes && ms.minutes.length >= minMinutesCount && ms.topics && ms.topics.length >= minTopicsCount) {
            MScount++;
            TopicCount += ms.topics.length;
            if (ms.topics.length > TopicMax) {
                TopicMax = ms.topics.length;
            }
            MinutesCount += ms.minutes.length;

            ms.topics.forEach(top => {
                ItemCount += top.infoItems.length;
                if (top.infoItems.length > ItemMax) {
                    ItemMax = top.infoItems.length;
                }
                top.infoItems.forEach(item => {
                    if (item.details) {
                        DetailCount += item.details.length;
                        if (item.details.length > DetailMax) {
                            DetailMax = item.details.length;
                        }
                    }
                });
            });
        }
    });
    console.log('# MeetingSeries: ', MScount);
    console.log('# Minutes      : ', MinutesCount);
    console.log('# Topics       : ', TopicCount, '  max: ', TopicMax, '  mean: ', (TopicCount/MScount).toFixed(1));
    console.log('# Items        : ', ItemCount, '  max: ', ItemMax, '  mean: ', (ItemCount/TopicCount).toFixed(1));
    console.log('# Details      : ', DetailCount, '  max: ', DetailMax, '  mean: ', (DetailCount/ItemCount).toFixed(1));
};


if (Meteor.isServer) {
    // statisticsDetails()
}
