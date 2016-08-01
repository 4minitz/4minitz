import { Meteor } from 'meteor/meteor';
import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { UserRoles } from './../userroles';
import { MeetingSeriesCollection } from './meetingseries_private'
import { MinutesCollection } from './minutes_private'
import { ServerSyncCollection } from './ServerSyncCollection'
import { FinalizeMailHandler } from '../mail/FinalizeMailHandler';
import { GlobalSettings } from './../GlobalSettings';

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
    },

    'workflow.finalizeMinute'(id, sendActionItems, sendInfoItems) {

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        let aMin = new Minutes(id);
        if (!userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
            throw new Meteor.Error("Cannot finalize minutes", "You are not moderator of the parent meeting series.");
        }

        try {
            // first we copy the topics of the finalize-minute to the parent series
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.server_finalizeLastMinute();
            let msAffectedDocs = getMeetingSeriesCollection().update(/*no client callback*/null,
                parentSeries._id, {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

            if (msAffectedDocs !== 1 && Meteor.isServer) {
                throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series')
            }

            // then we tag the minute as finalized

            let doc = {
                finalizedAt: new Date(),
                finalizedBy: Meteor.user().username,
                isFinalized: true,
                isUnfinalized: false
            };

            let affectedDocs = getMinutesCollection().update(/*no client callback*/null, id, {$set: doc});
            if (affectedDocs == 1 && Meteor.isServer) {
                if (!GlobalSettings.isEMailDeliveryEnabled()) {
                    console.log("Skip sending mails because email delivery is not enabled. To enable email delivery set " +
                        "enableMailDelivery to true in your settings.json file");
                    return;
                }

                let emails = Meteor.user().emails;
                Meteor.defer(() => { // server background tasks after successfully updated the minute doc
                    let senderEmail = (emails && emails.length > 0)
                        ? emails[0].address
                        : GlobalSettings.getDefaultEmailSenderAddress();
                    let finalizeMailHandler = new FinalizeMailHandler(aMin, senderEmail);
                    finalizeMailHandler.sendMails(sendActionItems, sendInfoItems);
                });
            }
        } catch(e) {
            console.error(e);
            throw e;
        }

    },

    'workflow.unfinalizeMinute'(id) {

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }


        let aMin = new Minutes(id);

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (!userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
            throw new Meteor.Error("Cannot un-finalize minutes", "You are not moderator of the parent meeting series.");
        }

        // it is not allowed to un-finalize a minute if it is not the last finalized one
        let parentSeries = aMin.parentMeetingSeries();
        if (!parentSeries.isUnfinalizeMinutesAllowed(id)) {
            throw new Meteor.Error("not-allowed", "This minutes is not allowed to be un-finalized.");
        }

        try {
            parentSeries.server_unfinalizeLastMinute();
            let msAffectedDocs = getMeetingSeriesCollection().update(/*no client callback*/null,
                parentSeries._id, {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

            if (msAffectedDocs !== 1 && Meteor.isServer) {
                throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series')
            }

            let doc = {
                isFinalized: false,
                isUnfinalized: true
            };

            getMinutesCollection().update(null, id, {$set: doc});
        } catch(e) {
            console.error(e);
            throw e;
        }
    }
});