import {subElementsHelper} from '../../helpers/subElements';
import {MeetingSeriesTopicsUpdater} from './meetingSeriesTopicsUpdater';
import {MinutesFinder} from '../minutesFinder';

/**
 *
 * @param meetingSeriesId
 * @param topicsVisibleFor array of user_ids states which user should be able to see these topics
 * @returns {MeetingSeriesTopicsUpdater}
 */
const createTopicsUpdater = (meetingSeriesId, topicsVisibleFor) => {
    return new MeetingSeriesTopicsUpdater(meetingSeriesId, topicsVisibleFor);
};

export class TopicsFinalizer {

    /**
     * @param meetingSeries array of user_ids states which user should be able to see these topics
     * @param topicsVisibleFor
     */
    static mergeTopicsForFinalize(meetingSeries, topicsVisibleFor) {
        const topicsUpdater = createTopicsUpdater(meetingSeries._id, topicsVisibleFor);
        const topicsFinalizer = new TopicsFinalizer(meetingSeries, topicsUpdater);
        const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);
        const secondLastMinutes = MinutesFinder.secondLastMinutesOfMeetingSeries(meetingSeries);
        topicsFinalizer.mergeTopics(lastMinutes.topics, secondLastMinutes._id);
    }

    /**
     * @param meetingSeries array of user_ids states which user should be able to see these topics
     * @param topicsVisibleFor
     */
    static mergeTopicsForUnfinalize(meetingSeries, topicsVisibleFor) {
        const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);
        const secondLastMinutes = MinutesFinder.secondLastMinutesOfMeetingSeries(meetingSeries);
        const topicsUpdater = createTopicsUpdater(meetingSeries._id, topicsVisibleFor);
        if (secondLastMinutes) {
            topicsUpdater.removeTopicsCreatedInMinutes(lastMinutes._id);
            topicsUpdater.removeTopicItemsCreatedInMinutes(lastMinutes._id);
            const topicsFinalizer = new TopicsFinalizer(meetingSeries, topicsUpdater);
            topicsFinalizer.mergeTopics(secondLastMinutes.topics);
        } else {
            topicsUpdater.removeAllTopics();
        }
    }

    constructor(meetingSeries, topicsUpdater) {
        this.meetingSeries = meetingSeries;
        this.topicsUpdater = topicsUpdater;
    }

    mergeTopics(minutesTopics, minIdContainingTopicsToInvalidateIsNew = false) {
        if (minIdContainingTopicsToInvalidateIsNew) {
            // we have to set all isNew-Flags in the topics collection to `false` since we want that all elements
            // created in the to-finalize protocol should be flagged as new.
            // But we should only look at the topics presented in the last-finalized protocol because all other
            // elements are already "invalidated".
            this.topicsUpdater.invalidateIsNewFlagOfTopicsPresentedInMinutes(minIdContainingTopicsToInvalidateIsNew);
        }

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

    /**
     * Merges all changes of the updateTopicDoc
     * into the current topic doc.
     * This means:
     *  - overwrite the simple properties (subject, responsible)
     *  - add new InfoItems / AIs
     *  - update existing InfoItems / AIs
     *  - delete sticky items which where deleted within the updateTopicDoc
     */
    _mergeTopicDocs(acceptingTopicDoc, resistantTopicDoc) {
        // overwrite primitive properties
        acceptingTopicDoc.subject = resistantTopicDoc.subject;
        acceptingTopicDoc.responsibles = resistantTopicDoc.responsibles;
        acceptingTopicDoc.isNew = resistantTopicDoc.isNew;
        acceptingTopicDoc.isRecurring = resistantTopicDoc.isRecurring;
        acceptingTopicDoc.isOpen = resistantTopicDoc.isOpen;
        acceptingTopicDoc.updatedAt = resistantTopicDoc.updatedAt;
        acceptingTopicDoc.updatedBy = resistantTopicDoc.updatedBy;

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