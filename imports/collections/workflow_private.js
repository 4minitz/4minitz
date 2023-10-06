import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { MinutesFinder } from '/imports/services/minutesFinder';
import { UserRoles } from './../userroles';
import { User } from './../user';
import { MeetingSeriesSchema } from './meetingseries.schema';
import { MinutesSchema } from './minutes.schema';
import { AttachmentsCollection } from './attachments_private';
import {MeetingSeriesTopicsUpdater} from '../services/finalize-minutes/meetingSeriesTopicsUpdater';
import {Topic} from '../topic';
import {TopicsFinder} from '../services/topicsFinder';

// todo merge with finalizer copy
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
        doc.createdBy = User.PROFILENAMEWITHFALLBACK(Meteor.user());
        delete doc.finalizedAt;
        delete doc.topics;
        doc.finalizedVersion = 0;
        doc.finalizedHistory = [];

        let topics = [];
        // copy open topics from this meeting series & set isNew=false, isSkipped=false
        const openTopics = TopicsFinder.allOpenTopicsOfMeetingSeries(parentMeetingSeries._id);
        console.log(openTopics);
        if (openTopics) {
            topics = openTopics;
            topics.forEach((topicDoc) => {
                let topic = new Topic(parentMeetingSeries, topicDoc);
                topic.tailorTopic();
                topic.invalidateIsNewFlag();
                if (topic.isSkipped()) {
                    topic.toggleSkip();
                }
            });
        }
        doc.topics = topics;

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
        console.log(`workflow.removeMinute: ${minutes_id}`);
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
                            console.error(`File wasn't removed, error: ${error.reason}`);
                        } else {
                            console.log('OK, removed linked attachments.');
                        }
                    }
                );
            }
        }
    },

    'workflow.removeMeetingSeries'(meetingseries_id) {
        console.log(`workflow.removeMeetingSeries: ${meetingseries_id}`);
        check(meetingseries_id, String);
        if (meetingseries_id === undefined || meetingseries_id === '')
            return;
        checkUserAvailableAndIsModeratorOf(meetingseries_id);
        // first we remove all containing minutes to make sure we don't get orphans
        // deleting all minutes of one series is allowed, even if they are finalized.
        MinutesSchema.remove({meetingSeries_id: meetingseries_id});

        // then we delete all topics related to this series
        const topicsUpdater = new MeetingSeriesTopicsUpdater(meetingseries_id);
        topicsUpdater.removeAllTopics();

        // then we remove the meeting series document itself
        MeetingSeriesSchema.remove(meetingseries_id);
        // remove all uploaded attachments for meeting series, if any exist
        if (Meteor.isServer && AttachmentsCollection.find({'meta.parentseries_id': meetingseries_id}).count() > 0) {
            AttachmentsCollection.remove({'meta.parentseries_id': meetingseries_id},
                function (error) {
                    if (error) {
                        console.error(`File wasn't removed, error: ${error.reason}`);
                    } else {
                        console.log('OK, removed linked attachments.');
                    }
                }
            );
            removeMeetingSeriesAttachmentDir(meetingseries_id); //eslint-disable-line
        }
    },

    'workflow.leaveMeetingSeries'(meetingSeries_id) {
        // check(meetingSeries_id, Meteor.Collection.ObjectID);
        check(meetingSeries_id, String);
        console.log(`meetingseries.leave:${meetingSeries_id}`);
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
        Minutes.updateVisibleForAndParticipantsForAllMinutesOfMeetingSeries(meetingSeries_id, visibleForArray);
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

        const topicsUpdater = new MeetingSeriesTopicsUpdater(meetingSeries_id);
        topicsUpdater.reOpenTopic(topic_id);

        //Write to currently unfinalized Minute, if existent
        const meetingSeries = new MeetingSeries(meetingSeries_id);
        let lastMinute = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);
        if (lastMinute && !lastMinute.isFinalized) {
            const topicDoc = topicsUpdater.getTopicById(topic_id);
            const topicObject = new Topic(meetingSeries, topicDoc);
            topicObject.tailorTopic();
            Meteor.call('minutes.addTopic', lastMinute._id, topicObject.getDocument(), true);
        }
    }
});
