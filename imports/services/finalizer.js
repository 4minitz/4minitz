import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import { MinutesSchema } from '/imports/collections/minutes.schema';
import { Minutes } from '/imports/minutes';
import { UserRoles } from '/imports/userroles';
import { FinalizeMailHandler } from '/imports/mail/FinalizeMailHandler';
import { GlobalSettings } from '/imports/config/GlobalSettings';
import { formatDateISO8601Time } from '/imports/helpers/date';

import '/imports/helpers/promisedMethods';

// todo merge with finalizer copy
function checkUserAvailableAndIsModeratorOf(meetingSeriesId) {
    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
        throw new Meteor.Error('not-authorized', 'You are not authorized to perform this action.');
    }

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (!userRoles.isModeratorOf(meetingSeriesId)) {
        throw new Meteor.Error('Cannot modify this minutes/series', 'You are not a moderator of the meeting series.');
    }
}

function sendFinalizationMail(minutes, sendActionItems, sendInfoItems) {
    if (!GlobalSettings.isEMailDeliveryEnabled()) {
        console.log('Skip sending mails because email delivery is not enabled. To enable email delivery set ' +
            'enableMailDelivery to true in your settings.json file');
        return;
    }

    let emails = Meteor.user().emails;
    Meteor.defer(() => { // server background tasks after successfully updated the minute doc
        const senderEmail = (emails && emails.length > 0)
            ? emails[0].address
            : GlobalSettings.getDefaultEmailSenderAddress();
        const finalizeMailHandler = new FinalizeMailHandler(minutes, senderEmail);
        finalizeMailHandler.sendMails(sendActionItems, sendInfoItems);
    });
}

function compileFinalizedInfo(minutes) {
    if (!minutes.finalizedAt) {
        return 'Never finalized';
    }

    const finalizedTimestamp = formatDateISO8601Time(minutes.finalizedAt),
        finalizedString = minutes.isFinalized? 'Finalized' : 'Unfinalized',
        version = minutes.finalizedVersion ? `Version ${minutes.finalizedVersion}. ` : '';

    return (`${version}${finalizedString} on ${finalizedTimestamp} by ${minutes.finalizedBy}`);
}

Meteor.methods({
    'workflow.finalizeMinute'(id, sendActionItems, sendInfoItems) {
        console.log('workflow.finalizeMinute on ' + id);
        check(id, String);

        let minutes = new Minutes(id);
        // check if minute is already finalized
        if (minutes.isFinalized) {
            throw new Meteor.Error('runtime-error', 'The minute is already finalized');
        }

        checkUserAvailableAndIsModeratorOf(minutes.parentMeetingSeriesID());

        // first we copy the topics of the finalize-minute to the parent series
        let parentSeries = minutes.parentMeetingSeries();
        parentSeries.server_finalizeLastMinute();
        let msAffectedDocs = MeetingSeriesSchema.update(
            parentSeries._id,
            {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

        const atLeastOneTopicExists = parentSeries.openTopics.length !== 0 || parentSeries.topics.length !== 0;
        if (msAffectedDocs !== 1 && atLeastOneTopicExists) {
            throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series');
        }

        // then we tag the minute as finalized
        let version = minutes.finalizedVersion + 1 || 1;

        let doc = {
            finalizedAt: new Date(),
            finalizedBy: Meteor.user().username,
            isFinalized: true,
            finalizedVersion: version
        };

        // update minutes object to generate new history entry
        Object.assign(minutes, doc);

        let history = minutes.finalizedHistory || [];
        history.push(compileFinalizedInfo(minutes));
        doc.finalizedHistory = history;

        let affectedDocs = MinutesSchema.update(id, {$set: doc});
        if (affectedDocs === 1 && !Meteor.isClient) {
            sendFinalizationMail(minutes, sendActionItems, sendInfoItems);
        }

        console.log('workflow.finalizeMinute DONE.');
    },

    'workflow.unfinalizeMinute'(id) {
        console.log('workflow.unfinalizeMinute on ' + id);
        check(id, String);

        let minutes = new Minutes(id);
        checkUserAvailableAndIsModeratorOf(minutes.parentMeetingSeriesID());

        // it is not allowed to un-finalize a minute if it is not the last finalized one
        let parentSeries = minutes.parentMeetingSeries();
        if (!parentSeries.isUnfinalizeMinutesAllowed(id)) {
            throw new Meteor.Error('not-allowed', 'This minutes is not allowed to be un-finalized.');
        }

        // ??? this will be called from the client ???
        // → todo check
        parentSeries.server_unfinalizeLastMinute();
        let msAffectedDocs = MeetingSeriesSchema.update(
            parentSeries._id,
            {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

        const atLeastOneTopicExists = parentSeries.openTopics.length !== 0 || parentSeries.topics.length !== 0;
        if (msAffectedDocs !== 1 && atLeastOneTopicExists) {
            throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series');
        }

        let doc = {
            finalizedAt: new Date(),
            finalizedBy: Meteor.user().username,
            isFinalized: false
        };

        // update minutes object to generate new history entry
        Object.assign(minutes, doc);

        let history = minutes.finalizedHistory || [];
        history.push(compileFinalizedInfo(minutes));
        doc.finalizedHistory = history;

        console.log('workflow.unfinalizeMinute DONE.');
        return MinutesSchema.update(id, {$set: doc});
    }
});


export class Finalizer {
    static finalize(minutesId, sendActionItems, sendInfoItems) {
        Meteor.callPromise('workflow.finalizeMinute', minutesId, sendActionItems, sendInfoItems);
    }

    static unfinalize(minutesId) {
        Meteor.callPromise('workflow.unfinalizeMinute', minutesId);
    }

    static finalizedInfo(minutesId) {
        const minutes = new Minutes(minutesId);
        return compileFinalizedInfo(minutes);
    }
}