import {subElementsHelper} from '../../helpers/subElements';
import {MeetingSeriesTopicsUpdater} from './meetingSeriesTopicsUpdater';
import {MinutesFinder} from '../minutesFinder';

const createTopicsUpdater = (meetingSeriesId) => {
    return new MeetingSeriesTopicsUpdater(meetingSeriesId);
};

export class TopicsFinalizer {

    static mergeTopicsForFinalize(meetingSeries) {
        const topicsFinalizer = new TopicsFinalizer(meetingSeries);
        const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);
        topicsFinalizer.mergeTopics(lastMinutes.topics);
    }

    static mergeTopicsForUnfinalize(meetingSeries) {
        const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);
        const secondLastMinutes = MinutesFinder.secondLastMinutesOfMeetingSeries(meetingSeries);
        const topicsUpdater = createTopicsUpdater(meetingSeries._id);
        if (secondLastMinutes) {
            topicsUpdater.removeTopicsCreatedInMinutes(lastMinutes._id);
            topicsUpdater.removeTopicItemsCreatedInMinutes(lastMinutes._id);
            const topicsFinalizer = new TopicsFinalizer(meetingSeries);
            topicsFinalizer.mergeTopics(secondLastMinutes.topics);
        } else {
            topicsUpdater.removeAllTopics();
        }
    }

    constructor(meetingSeries) {
        this.meetingSeries = meetingSeries;
        this.topicsUpdater = createTopicsUpdater(meetingSeries._id);
    }

    mergeTopics(minutesTopics) {
        this.topicsUpdater.invalidateIsNewFlagOfAllTopicsAndItems();

        // iterate backwards through the topics of the minute
        for (let i = minutesTopics.length; i-- > 0;) {
            let topicDoc = minutesTopics[i];
            topicDoc.isSkipped = false;
            this._mergeOrInsertTopic(topicDoc);
        }
    }

    _mergeOrInsertTopic(topicDoc) {
        const existingTopicDoc = this.topicsUpdater.getTopicById(topicDoc._id);
        if (existingTopicDoc) {
            topicDoc = this._mergeTopicDocs(existingTopicDoc, topicDoc);
        }
        topicDoc.isOpen = !(TopicsFinalizer.isTopicClosedAndHasNoOpenAIs(topicDoc));
        this.topicsUpdater.upsertTopic(topicDoc);
    }

    _mergeTopicDocs(acceptingTopicDoc, resistantTopicDoc) {
        // overwrite primitive properties
        acceptingTopicDoc.subject = resistantTopicDoc.subject;
        acceptingTopicDoc.responsibles = resistantTopicDoc.responsibles;
        acceptingTopicDoc.isNew = resistantTopicDoc.isNew;
        acceptingTopicDoc.isRecurring = resistantTopicDoc.isRecurring;
        acceptingTopicDoc.isOpen = resistantTopicDoc.isOpen;

        // loop backwards through topic items and upsert them in the accepting one
        for (let i = resistantTopicDoc.infoItems.length; i-- > 0;) {
            let infoDoc = resistantTopicDoc.infoItems[i];
            let index = subElementsHelper.findIndexById(infoDoc._id, acceptingTopicDoc.infoItems);
            if (index === undefined) {
                acceptingTopicDoc.infoItems.unshift(infoDoc);
            } else {
                acceptingTopicDoc.infoItems[index] = infoDoc;
            }
        }

        // delete all sticky items listed in the this topic but not in the updateTopicDoc
        // (these were deleted during the last minute)
        acceptingTopicDoc.infoItems = acceptingTopicDoc.infoItems.filter(itemDoc => {
            if (TopicsFinalizer.isStickyItem(itemDoc)) {
                let indexInResistantTopic = subElementsHelper.findIndexById(itemDoc._id, resistantTopicDoc.infoItems);
                return !(indexInResistantTopic === undefined);
            }
            return true;
        });

        return acceptingTopicDoc;
    }

    static isStickyItem(item) {
        // TODO: Use ItemFactory to create info-/actionItem Object then we can use the isSticky-Method
        return (item.itemType === 'infoItem' && item.isSticky) || (item.itemType === 'actionItem' && item.isOpen);
    }

    static isTopicClosedAndHasNoOpenAIs(topicDoc) {
        const hasOpenActionItems = topicDoc.infoItems.some(item => item.isOpen);
        return (!topicDoc.isOpen && !hasOpenActionItems && !topicDoc.isRecurring);
    }

}