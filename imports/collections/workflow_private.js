import { Meteor } from 'meteor/meteor';
import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { UserRoles } from './../userroles';
import { MeetingSeriesCollection } from './meetingseries_private'
import { MinutesCollection } from './minutes_private'
import { FinalizeMailHandler } from '../mail/FinalizeMailHandler';
import { GlobalSettings } from './../GlobalSettings';

function checkUserAvailableAndIsModeratorOf(meetingSeriesId) {
    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
        throw new Meteor.Error('not-authorized');
    }

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (!userRoles.isModeratorOf(meetingSeriesId)) {
        throw new Meteor.Error("Cannot modify this minutes/series", "You are not moderator of the meeting series.");
    }
}

function checkUserMayLeave(meetingSeriesId) {
    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
        throw new Meteor.Error('not-authorized');
    }

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (userRoles.isModeratorOf(meetingSeriesId)) {
        throw new Meteor.Error("Cannot leave this meeting series", "Moderators may only be removed by other moderators.");
    }
    if (! userRoles.isInvitedTo(meetingSeriesId)) {
        throw new Meteor.Error("Cannot leave this meeting series", "You are not invited to this meeting series.");
    }
}



Meteor.methods({
    'workflow.addMinutes'(doc, clientCallback) {
        checkUserAvailableAndIsModeratorOf(doc.meetingSeries_id);

        // It is not allowed to insert new minutes if the last minute was not finalized
        check(doc.meetingSeries_id, String);
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

        try {
            let newMinutesID = MinutesCollection.insert(doc);
            try {
                parentMeetingSeries.minutes.push(newMinutesID);
                let affectedDocs = MeetingSeriesCollection.update(
                    parentMeetingSeries._id, {$set: {minutes: parentMeetingSeries.minutes}});
                if (affectedDocs !== 1) {
                    throw new Meteor.Error('runtime-error', 'Update parent meeting series failed - no docs affected');
                }
            } catch (e) {
                MinutesCollection.remove({_id: newMinutesID});
                console.error(e);
                throw e;
            }

            if (Meteor.isClient && clientCallback) {
                clientCallback(newMinutesID);
            }

            return newMinutesID;

        } catch (e) {
            if (Meteor.isClient) {
                console.error(e);
                throw e;
            }
        }
    },

    'workflow.removeMinute'(id) {
        check(id, String);
        if (id == undefined || id == "") {
            throw new Meteor.Error('illegal-arguments', 'Minutes id required');
        }
        let aMin = new Minutes(id);
        let meetingSeriesId = aMin.parentMeetingSeriesID();
        checkUserAvailableAndIsModeratorOf(meetingSeriesId);

        let affectedDocs = MinutesCollection.remove({_id: id, isFinalized: false});
        if (affectedDocs > 0) {
            // remove the reference in the meeting series minutes array
            MeetingSeriesCollection.update(meetingSeriesId, {$pull: {'minutes': id}});
        }
    },

    'workflow.finalizeMinute'(id, sendActionItems, sendInfoItems) {
        check(id, String);
        let aMin = new Minutes(id);
        checkUserAvailableAndIsModeratorOf(aMin.parentMeetingSeriesID());

        try {
            // first we copy the topics of the finalize-minute to the parent series
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.server_finalizeLastMinute();
            let msAffectedDocs = MeetingSeriesCollection.update(
                parentSeries._id, {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

            if (msAffectedDocs !== 1) {
                throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series')
            }

            // then we tag the minute as finalized
            let version = 1;
            if (aMin.finalizedVersion) {
                version = aMin.finalizedVersion + 1;
            }
            let doc = {
                finalizedAt: new Date(),
                finalizedBy: Meteor.user().username,
                isFinalized: true,
                finalizedVersion: version
            };
            // update aMin object to generate new history entry
            Object.assign(aMin, doc);
            let history = aMin.finalizedHistory;
            if (! aMin.finalizedHistory) {
                history = [];
            }
            history.push(aMin.getFinalizedString());
            doc["finalizedHistory"] = history;
            console.log(history.join("\n"));

            let affectedDocs = MinutesCollection.update(id, {$set: doc});

            if (affectedDocs === 1 && !Meteor.isClient) {
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
            if (!Meteor.isClient) {
                console.error(e);
                throw e;
            }
        }

    },

    'workflow.unfinalizeMinute'(id) {
        check(id, String);
        let aMin = new Minutes(id);
        checkUserAvailableAndIsModeratorOf(aMin.parentMeetingSeriesID());

        // it is not allowed to un-finalize a minute if it is not the last finalized one
        let parentSeries = aMin.parentMeetingSeries();
        if (!parentSeries.isUnfinalizeMinutesAllowed(id)) {
            throw new Meteor.Error("not-allowed", "This minutes is not allowed to be un-finalized.");
        }

        try {
            parentSeries.server_unfinalizeLastMinute();
            let msAffectedDocs = MeetingSeriesCollection.update(
                parentSeries._id, {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

            if (msAffectedDocs !== 1) {
                throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series')
            }

            let doc = {
                finalizedAt: new Date(),
                finalizedBy: Meteor.user().username,
                isFinalized: false,
            };
            // update aMin object to generate new history entry
            Object.assign(aMin, doc);
            let history = aMin.finalizedHistory;
            if (! aMin.finalizedHistory) {
                history = [];
            }
            history.push(aMin.getFinalizedString());
            doc["finalizedHistory"] = history;

            return MinutesCollection.update(id, {$set: doc});
        } catch(e) {
            if (!Meteor.isClient) {
                console.error(e);
                throw e;
            }
        }
    },

    'workflow.removeMeetingSeries'(id) {
        check(id, String);
        console.log("meetingseries.remove:"+id);
        if (id == undefined || id == "")
            return;

        checkUserAvailableAndIsModeratorOf(id);

        // first we remove all containing minutes to make sure we don't get orphans
        // deleting all minutes of one series is allowed, even if they are finalized.
        MinutesCollection.remove({meetingSeries_id: id});

        // then we remove the meeting series document itself
        MeetingSeriesCollection.remove(id);

    },

    'workflow.leaveMeetingSeries'(meetingSeries_id) {
        // check(meetingSeries_id, Meteor.Collection.ObjectID);
        check(meetingSeries_id, String);
        console.log("meetingseries.leave:"+meetingSeries_id);
        if (meetingSeries_id == undefined || meetingSeries_id == "")
            return;

        checkUserMayLeave(meetingSeries_id);

        // 1st.: remove user from roles
        let roles = new UserRoles();
        roles.removeRoles(meetingSeries_id);

        // 2nd.: adapt "visibleFor" of meeting series
        let ms = new MeetingSeries(meetingSeries_id);
        let visibleForArray = ms.visibleFor;
        let index = visibleForArray.indexOf(Meteor.userId());
        while(index !== -1) {   // loop, just in case we have multiple hits of this user
            visibleForArray.splice(index, 1);
            index = visibleForArray.indexOf(Meteor.userId());
        }
        MeetingSeriesCollection.update(meetingSeries_id, {$set: {visibleFor: visibleForArray}});

        // 3rd.: sync "visibleFor" to minutes that have this meeting series as parent
        if (MinutesCollection.find({meetingSeries_id: meetingSeries_id}).count() > 0) {
            MinutesCollection.update({meetingSeries_id: meetingSeries_id}, {$set: {visibleFor: visibleForArray}}, {multi: true});

            // refresh participants to non-finalized meetings
            MinutesCollection.find({meetingSeries_id: meetingSeries_id}).forEach (min => {
                if (!min.isFinalized) {
                    min.refreshParticipants(true);
                }
            });
        }
    }
});