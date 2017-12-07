import { Meteor } from 'meteor/meteor';
import { TopicSchema } from '/imports/collections/topic.schema';
import {TopicsFinder} from '../topicsFinder';
import {Minutes} from '../../minutes';

export class MeetingSeriesTopicsUpdater {

    constructor(meetingSeriesId) {
        this.meetingSeriesId = meetingSeriesId;
    }

    invalidateIsNewFlagOfTopicsPresentedInMinutes(minutesId) {
        const minutes = new Minutes(minutesId);
        const topicIds = minutes.topics.map(topicDoc => {
            return topicDoc._id;
        });
        TopicsFinder.allTopicsIdentifiedById(topicIds).forEach((topicDoc) => {
            topicDoc.isNew = false;
            topicDoc.infoItems.forEach(itemDoc => {
                itemDoc.isNew = false;
                itemDoc.details.forEach(detail => {
                    detail.isNew = false;
                });
            });
            this.upsertTopic(topicDoc);
        });
    }

    getTopicById(topicId) {
        return TopicsFinder.getTopicById(topicId, this.meetingSeriesId);
    }

    upsertTopic(topicDoc) {
        topicDoc.parentId = this.meetingSeriesId;
        const topicId = topicDoc._id;
        TopicSchema.upsert(
            { parentId: this.meetingSeriesId, _id: topicId },
            topicDoc
        );
    }

    removeTopicsCreatedInMinutes(minutesId) {
        TopicSchema.remove({ parentId: this.meetingSeriesId, createdInMinute: minutesId });
    }

    removeTopicItemsCreatedInMinutes(minutesId) {
        TopicsFinder.allTopicsOfMeetingSeriesWithAtLeastOneItemCreatedInMinutes(this.meetingSeriesId, minutesId)
            .forEach((topicDoc) => {
                topicDoc.infoItems = topicDoc.infoItems.filter(infoItemDoc => {
                    return infoItemDoc.createdInMinute !== minutesId;
                });
                this.upsertTopic(topicDoc);
            });
    }

    removeAllTopics() {
        TopicSchema.remove({ parentId: this.meetingSeriesId });
    }

    reOpenTopic(topicId) {
        const affectedDocuments = TopicSchema.update(
            { parentId: this.meetingSeriesId, _id: topicId },
            { isOpen: true }
        );
        if (affectedDocuments !== 1) {
            throw new Meteor.Error('runtime-error', 'Could not re-open topic.');
        }
    }

}