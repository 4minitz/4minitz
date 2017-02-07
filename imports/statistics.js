import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { MinutesCollection } from './collections/minutes_private';
import { MeetingSeriesCollection } from './collections/meetingseries_private';
import { Attachment } from './attachment'

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
                numberOfAttachmentMB = Math.floor(Attachment.countAllBytes() / 1024 / 1024)+ " MB";

            StatisticsCollection.remove({});

            let statistics = new Statistics();
            statistics.result = [{
                description: "Number of users (active)",
                value: numberOfUsers + " (" + numberOfActiveUsers + ")"
            }, {
                description: "Number of meeting series",
                value: numberOfMeetingSeries.toString()
            }, {
                description: "Number of meeting minutes",
                value: numberOfMinutes.toString()
            }, {
                description: "Number of attachments",
                value: numberOfAttachments.toString()
            }, {
                description: "Attachments size",
                value: numberOfAttachmentMB.toString()
            }];

            statistics.save();
        }
    }
});