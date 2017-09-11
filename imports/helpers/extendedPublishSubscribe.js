import { Meteor } from 'meteor/meteor';
import { MeetingSeries } from './../meetingseries';

export class extendedPublishSubscribeHandler {
    //This function will subscribe the giben collection and returns a liveQuery for it, based on the meeting series collection
    static subscribeWithMeetingSeriesLiveQuery = (collectionName) => {
        if (Meteor.isClient) {
            Meteor.subscribe(collectionName);

            return () => {
                // In case the user is invited to an existing meeting series
                // from her point of view a meeting series is added.
                // We re-subscribe to the attachments collection in this case,
                // to force that already existing attachments of this new
                // meeting series are sent from server to this client.
                // This live query lives happily til the end of the world...  ;-)
                let meetingSeriesLiveQuery = MeetingSeries.find();
                meetingSeriesLiveQuery.observe(
                    {
                        // "added" is for OTHER users, that are invited to existing meeting series
                        'added': function () {
                            Meteor.subscribe(collectionName);
                        },
                        // "changed" is for THIS user, while she creates a new meeting series for herself.
                        // Such a series is first added (in client) and the "added" event above fires in the client
                        // but at this time point the "visibleFor" field may not yet been set properly on the server.
                        // So the server re-publish does not regard this meeting series as visible during
                        // calculation of visible attachments.
                        // So, we also register for the "changed" event to re-subscribe also when visibility changes
                        // on the server side.
                        'changed': function () {
                            Meteor.subscribe(collectionName);
                        }
                    }
                );
            };
        }
    };

    static publishByVisibleMeetingSeries = (collectionName, collectionObject, queryFieldWithMeetingSeriesId) => {
        if (Meteor.isServer) {
            Meteor.publish(collectionName, function () {
                // We publish only those attachments that are bound to
                // a meeting series that is visible for the current user
                let meetingSeriesIDs = MeetingSeries.getAllVisibleIDsForUser(this.userId);
                return collectionObject.find(
                    {[queryFieldWithMeetingSeriesId]: {$in: meetingSeriesIDs}}
                ).cursor;
            });
        }
    };
}