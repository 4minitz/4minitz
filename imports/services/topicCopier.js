import {subElementsHelper} from '../helpers/subElements';


class TopicsUpdater {

    constructor(meetingSeries) {
        this.meetingSeries = meetingSeries;
    }

    invalidateIsNewFlagOfAllTopicsAndItems() {
        this.meetingSeries.topics.forEach((topicDoc) => {
            topicDoc.isNew = false;
            topicDoc.infoItems.forEach(itemDoc => {
                itemDoc.isNew = false;
            });
        });
    }

    getTopicById(topicId) {
        const index = subElementsHelper.findIndexById(topicId, this.meetingSeries.topics);
        return (index === undefined) ? false : this.meetingSeries.topics[index];
    }

    upsertTopic(topicDoc) {
        const index = subElementsHelper.findIndexById(topicDoc._id, this.meetingSeries.topics);
        if (index === undefined) {
            this.meetingSeries.topics.unshift(topicDoc);  // add to front of array
        } else {
            this.meetingSeries.topics[index] = topicDoc;
        }
    }

}

export class TopicsCopier {

    constructor(meetingSeries) {
        this.meetingSeries = meetingSeries;
        this.topicsUpdater = new TopicsUpdater(meetingSeries);
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
        topicDoc.isOpen = !(TopicsCopier.isTopicClosedAndHasNoOpenAIs(topicDoc));
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
            if (TopicsCopier.isStickyItem(itemDoc)) {
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