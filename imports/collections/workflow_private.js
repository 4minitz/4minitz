import { Meteor } from 'meteor/meteor';
import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { UserRoles } from './../userroles';
import { MeetingSeriesCollection } from './meetingseries_private'
import { MinutesCollection } from './minutes_private'
import { ServerSyncCollection } from './ServerSyncCollection'

let meetingSeriesSyncCollection = null;
let minutesSyncCollection = null;

function getMeetingSeriesCollection() {
    if (null === meetingSeriesSyncCollection) {
        meetingSeriesSyncCollection = new ServerSyncCollection(MeetingSeriesCollection, Meteor);
    }
    return meetingSeriesSyncCollection;
}

function getMinutesCollection() {
    if (null === minutesSyncCollection) {
        minutesSyncCollection = new ServerSyncCollection(MinutesCollection, Meteor);
    }
    return minutesSyncCollection;
}

Meteor.methods({
    'workflow.addMinutes'(doc, clientCallback) {
        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // It is not allowed to insert new minutes if the last minute was not finalized
        let parentMeetingSeries = new MeetingSeries(doc.meetingSeries_id);
        if (!parentMeetingSeries.addNewMinutesAllowed()) {
            // last minutes is not finalized!
            throw new Meteor.Error("Cannot create new Minutes", "Last Minutes must be finalized first.");
        }

        // It also not allowed to insert a new minute dated before the last finalized one
        if (!parentMeetingSeries.isMinutesDateAllowed(/*we have no minutes_id*/null, doc.date)) {
            // invalid date
            throw new Meteor.Error('Cannot create new Minutes', 'Invalid date - it is not allowed to create a new minute' +
                'dated before the last finalized one.');
        }

        doc.isFinalized = false;
        doc.isUnfinalized = false;

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (!userRoles.isModeratorOf(doc.meetingSeries_id)) {
            throw new Meteor.Error("Cannot create new minutes", "You are not moderator of the parent meeting series.");
        }

        let asyncCallback = function(error, newMinutesID) {
            if (!error && clientCallback) {
                parentMeetingSeries.minutes.push(newMinutesID);
                getMeetingSeriesCollection().update(null, parentMeetingSeries._id, {$set: {minutes: parentMeetingSeries.minutes}});
                clientCallback(newMinutesID);
            }
        };

        try {
            let newMinutesID = getMinutesCollection().insert(asyncCallback, doc);
            if (Meteor.isServer) {

                try {
                    parentMeetingSeries.minutes.push(newMinutesID);
                    getMeetingSeriesCollection().update(null, parentMeetingSeries._id, {$set: {minutes: parentMeetingSeries.minutes}});
                } catch (e) {
                    getMeetingSeriesCollection().remove({_id: newMinutesID});
                    console.error(e);
                    throw e;
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
});