import { Meteor } from 'meteor/meteor';

import { MeetingSeriesCollection } from './collections/meetingseries_private';
import { MinutesCollection } from "./collections/minutes_private";


Meteor.methods({
    "server.statistics"() {
        const numberOfMeetingSeries = MeetingSeriesCollection.find().count(),
            numberOfMeetingMinutes = MinutesCollection.find().count(),
            numberOfUsers = Meteor.users.find().count(),
            result = {numberOfMeetingMinutes, numberOfMeetingSeries, numberOfUsers};
        return result;
    }
});