import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { MinutesFinder } from '/imports/services/minutesFinder';
import { UserRoles } from './../userroles';
import { MeetingSeriesSchema } from './meetingseries.schema';
import { MinutesSchema } from './minutes.schema';
import { AttachmentsCollection, calculateAndCreateStoragePath} from './attachments_private';
import { FinalizeMailHandler } from '../mail/FinalizeMailHandler';
import { GlobalSettings } from '../config/GlobalSettings';

function checkUserAvailableAndIsModeratorOf(meetingSeriesId) {
    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
        throw new Meteor.Error('not-authorized', 'You are not authorized to perform this action.');
    }

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (!userRoles.isModeratorOf(meetingSeriesId)) {
        throw new Meteor.Error('Cannot modify this minutes/series', 'You are not moderator of the meeting series.');
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
        throw new Meteor.Error('Cannot leave this meeting series', 'Moderators may only be removed by other moderators.');
    }
    if (! userRoles.isInvitedTo(meetingSeriesId)) {
        throw new Meteor.Error('Cannot leave this meeting series', 'You are not invited to this meeting series.');
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
            throw new Meteor.Error('Cannot create new Minutes', 'Last Minutes must be finalized first.');
        }

        // It also not allowed to insert a new minute dated before the last finalized one
        if (!parentMeetingSeries.isMinutesDateAllowed(/*we have no minutes_id*/null, doc.date)) {
            // invalid date
            throw new Meteor.Error('Cannot create new Minutes', 'Invalid date - it is not allowed to create a new minute' +
                'dated before the last finalized one.');
        }

        doc.isFinalized = false;
        doc.createdAt = new Date();
        delete doc.finalizedAt;
        doc.finalizedVersion = 0;
        doc.finalizedHistory = [];

        try {
            let newMinutesID = MinutesSchema.insert(doc);
            try {
                parentMeetingSeries.minutes.push(newMinutesID);
                let affectedDocs = MeetingSeriesSchema.update(
                    parentMeetingSeries._id, {$set: {minutes: parentMeetingSeries.minutes}});
                if (affectedDocs !== 1) {
                    throw new Meteor.Error('runtime-error', 'Update parent meeting series failed - no docs affected');
                }
            } catch (e) {
                MinutesSchema.remove({_id: newMinutesID});
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

    'workflow.removeMinute'(minutes_id) {
        check(minutes_id, String);
        if (minutes_id === undefined || minutes_id === '') {
            throw new Meteor.Error('illegal-arguments', 'Minutes id required');
        }
        console.log('workflow.removeMinute: '+minutes_id);
        let aMin = new Minutes(minutes_id);
        let meetingSeriesId = aMin.parentMeetingSeriesID();
        checkUserAvailableAndIsModeratorOf(meetingSeriesId);

        let affectedDocs = MinutesSchema.remove({_id: minutes_id, isFinalized: false});
        if (affectedDocs > 0) {
            // remove the reference in the meeting series minutes array
            MeetingSeriesSchema.update(meetingSeriesId, {$pull: {'minutes': minutes_id}});

            // remove all uploaded attachments for meeting series, if any exist
            if (Meteor.isServer && AttachmentsCollection.find({'meta.meetingminutes_id': minutes_id}).count() > 0) {
                AttachmentsCollection.remove({'meta.meetingminutes_id': minutes_id},
                    function (error) {
                        if (error) {
                            console.error('File wasn\'t removed, error: ' + error.reason);
                        } else {
                            console.log('OK, removed linked attachments.');
                        }
                    }
                );
            }
        }
    },

    'workflow.finalizeMinute'(id, sendActionItems, sendInfoItems) {
        console.log('workflow.finalizeMinute on '+id);
        check(id, String);
        let aMin = new Minutes(id);
        checkUserAvailableAndIsModeratorOf(aMin.parentMeetingSeriesID());

        try {
            // check if minute is already finalized
            if (aMin.isFinalized) {
                throw new Meteor.Error('runtime-error', 'The minute is already finalized');
            }

            // first we copy the topics of the finalize-minute to the parent series
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.server_finalizeLastMinute();
            let msAffectedDocs = MeetingSeriesSchema.update(
                parentSeries._id,
                {$set: {topics: parentSeries.topics, openTopics: parentSeries.openTopics}});

            const atLeastOneTopicExists = parentSeries.openTopics.length !== 0 || parentSeries.topics.length !== 0;
            if (msAffectedDocs !== 1 && atLeastOneTopicExists) {
                throw new Meteor.Error('runtime-error', 'Unknown error occurred when updating topics of parent series');
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
            doc['finalizedHistory'] = history;
            console.log(history.join('\n'));

            let affectedDocs = MinutesSchema.update(id, {$set: doc});

            if (affectedDocs === 1 && !Meteor.isClient) {
                if (!GlobalSettings.isEMailDeliveryEnabled()) {
                    console.log('Skip sending mails because email delivery is not enabled. To enable email delivery set ' +
                        'enableMailDelivery to true in your settings.json file');
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
        console.log('workflow.finalizeMinute DONE.');
    },

    'workflow.unfinalizeMinute'(id) {
        console.log('workflow.unfinalizeMinute on '+id);
        check(id, String);
        let aMin = new Minutes(id);
        checkUserAvailableAndIsModeratorOf(aMin.parentMeetingSeriesID());

        // it is not allowed to un-finalize a minute if it is not the last finalized one
        let parentSeries = aMin.parentMeetingSeries();
        if (!parentSeries.isUnfinalizeMinutesAllowed(id)) {
            throw new Meteor.Error('not-allowed', 'This minutes is not allowed to be un-finalized.');
        }

        try {
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
            // update aMin object to generate new history entry
            Object.assign(aMin, doc);
            let history = aMin.finalizedHistory;
            if (! aMin.finalizedHistory) {
                history = [];
            }
            history.push(aMin.getFinalizedString());
            doc['finalizedHistory'] = history;

            return MinutesSchema.update(id, {$set: doc});
        } catch(e) {
            if (!Meteor.isClient) {
                console.error(e);
                throw e;
            }
        }
        console.log('workflow.unfinalizeMinute DONE.');
    },

    'workflow.removeMeetingSeries'(meetingseries_id) {
        console.log('workflow.removeMeetingSeries: '+meetingseries_id);
        check(meetingseries_id, String);
        if (meetingseries_id === undefined || meetingseries_id === '')
            return;

        checkUserAvailableAndIsModeratorOf(meetingseries_id);

        // first we remove all containing minutes to make sure we don't get orphans
        // deleting all minutes of one series is allowed, even if they are finalized.
        MinutesSchema.remove({meetingSeries_id: meetingseries_id});

        // then we remove the meeting series document itself
        MeetingSeriesSchema.remove(meetingseries_id);

        // remove all uploaded attachments for meeting series, if any exist
        if (Meteor.isServer &&
            AttachmentsCollection.find({'meta.parentseries_id': meetingseries_id}).count() > 0) {
            AttachmentsCollection.remove({'meta.parentseries_id': meetingseries_id},
                function (error) {
                    if (error) {
                        console.error('File wasn\'t removed, error: ' + error.reason);
                    } else {
                        console.log('OK, removed linked attachments.');
                    }
                }
            );
            removeMeetingSeriesAttachmentDir(meetingseries_id);
        }
    },

    'workflow.leaveMeetingSeries'(meetingSeries_id) {
        // check(meetingSeries_id, Meteor.Collection.ObjectID);
        check(meetingSeries_id, String);
        console.log('meetingseries.leave:'+meetingSeries_id);
        if (meetingSeries_id === undefined || meetingSeries_id === '')
            return;

        checkUserMayLeave(meetingSeries_id);

        // 1st.: remove user from roles
        let roles = new UserRoles();
        roles.removeAllRolesForMeetingSeries(meetingSeries_id);

        // 2nd.: adapt "visibleFor" of meeting series
        let ms = new MeetingSeries(meetingSeries_id);
        let visibleForArray = ms.visibleFor;
        let index = visibleForArray.indexOf(Meteor.userId());
        while(index !== -1) {   // loop, just in case we have multiple hits of this user
            visibleForArray.splice(index, 1);
            index = visibleForArray.indexOf(Meteor.userId());
        }
        MeetingSeriesSchema.update(meetingSeries_id, {$set: {visibleFor: visibleForArray}});

        // 3rd.: sync "visibleFor" to minutes that have this meeting series as parent
        if (MinutesSchema.find({meetingSeries_id: meetingSeries_id}).count() > 0) {
            MinutesSchema.update({meetingSeries_id: meetingSeries_id}, {$set: {visibleFor: visibleForArray}}, {multi: true});

            // refresh participants to non-finalized meetings
            MinutesSchema.getCollection().find({meetingSeries_id: meetingSeries_id}).forEach (min => {
                if (!min.isFinalized) {
                    min.refreshParticipants(true);
                }
            });
        }
    },
    
        
    'workflow.reopenTopicFromMeetingSeries'(meetingSeries_id, topic_id) {
        //ensure parameters are complete
        check(meetingSeries_id, String);
        if (meetingSeries_id === undefined || meetingSeries_id === '') {
            throw new Meteor.Error('illegal-arguments', 'meetingSeries id required');
        }
        check(topic_id, String);
        if (topic_id === undefined || topic_id === '') {
            throw new Meteor.Error('illegal-arguments', 'topic id required');
        }       
        
        //ensure user is logged in and moderator
        checkUserAvailableAndIsModeratorOf(meetingSeries_id);
        
        //ensure parameters are valid
        let meetingSeries = new MeetingSeries(meetingSeries_id);        
        let topicDoc = meetingSeries.findTopic(topic_id);
        if (topicDoc === undefined) {
            throw new Meteor.Error('illegal-arguments', 'topic could not been found within given meeting series');
        }
        
        if (topicDoc.isOpen) {
            throw new Meteor.Error('illegal-arguments', 'topic is already open');
        }
        
        //Reopen existing topic
        topicDoc.isOpen = true;

        // Only sticky infoItems shall be part of
        // - meeting series "openTopics" and
        // - already started minutes
        let cleanedItems = [];
        topicDoc.infoItems.map(item => {
            if (item.itemType === 'infoItem' && item.isSticky) {
                cleanedItems.push(item);
            }
        });
        let cleanedTopicDoc = {};
        Object.assign(cleanedTopicDoc, topicDoc);
        cleanedTopicDoc.infoItems = cleanedItems;

        let modifierDoc = {};
        let modifierOpenCleanedDoc = {
            openTopics: cleanedTopicDoc
        };
        for (let property in topicDoc) {
            if (topicDoc.hasOwnProperty(property)) {
                modifierDoc['topics.$.' + property] = topicDoc[property];
            }
        }
        
        MeetingSeriesSchema.update(
                {_id: meetingSeries_id, 'topics._id': topic_id},
                {$set: modifierDoc}
        );
        MeetingSeriesSchema.update(
                {_id: meetingSeries_id, 'topics._id': topic_id},
                {$push: modifierOpenCleanedDoc}
        );
        
        //Write to currently unfinalized Minute, if existent
        let lastMinute = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);
        if (lastMinute && !lastMinute.isFinalized) {
            Meteor.call('minutes.addTopic', lastMinute._id, cleanedTopicDoc, true);
        }
    }
});