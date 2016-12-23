import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { StatisticsSchema } from './statistics.schema';
import { Statistics } from '../statistics';
import { MinutesCollection } from './minutes_private';
import { MeetingSeriesCollection } from './meetingseries_private';

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

            result = {result: [
                {   description: "Number of meeting minutes",
                    value:  numberOfMinutes      },
                {   description: "Number of meeting series",
                    value:  numberOfMeetingSeries      },
                {   description: "Number of users",
                    value:  numberOfUsers      }
            ]};

        StatisticsCollection.remove({});
        StatisticsCollection.insert(result);
    }
});
