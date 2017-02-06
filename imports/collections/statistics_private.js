import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { StatisticsSchema } from './statistics.schema';
import { Statistics } from '../statistics';
import { MinutesCollection } from './minutes_private';
import { MeetingSeriesCollection } from './meetingseries_private';
import { Attachment } from '../attachment'

export let StatisticsCollection = new Mongo.Collection('statistics',
    {
        transform: function (doc) {
            return new Statistics(doc);
        }
    }
);

if (Meteor.isServer) {
    Meteor.publish('statistics', function () {
        return StatisticsCollection.find();
    });
}
if (Meteor.isClient) {
    Meteor.subscribe('statistics');
}

StatisticsCollection.attachSchema(StatisticsSchema);

Meteor.methods({
    'statistics.update'() {
        const numberOfMeetingSeries = MeetingSeriesCollection.find().count(),
            numberOfMinutes = MinutesCollection.find().count(),
            numberOfUsers = Meteor.users.find().count(),
            numberOfActiveUsers = Meteor.users.find({$or: [{isInactive: { $exists: false }}, {isInactive: false}]}).count(),
            numberOfAttachments = Attachment.countAll(),
            numberOfAttachmentMB = Math.floor(Attachment.countAllBytes() / 1024 / 1024)+ " MB";

            result = {result: [
                {   description: "Number of users (active)",
                    value:  numberOfUsers + " ("+numberOfActiveUsers+")"     },
                {   description: "Number of meeting series",
                    value:  numberOfMeetingSeries      },
                {   description: "Number of meeting minutes",
                    value:  numberOfMinutes      },
                {   description: "Number of attachments",
                    value:  numberOfAttachments},
                {   description: "Attachments size",
                    value:  numberOfAttachmentMB},
            ]};

        StatisticsCollection.remove({});
        StatisticsCollection.insert(result);
    }
});
