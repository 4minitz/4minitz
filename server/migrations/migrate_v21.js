import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import { TopicSchema } from '/imports/collections/topic.schema';
import {MinutesFinder} from '../../imports/services/minutesFinder';
import {TopicsFinder} from '../../imports/services/topicsFinder';
import {MinutesIterator} from './helpers/minutesIterator';

// This Migration corrects the bug introduced in MigrationV18
// MigrationV18 removes some items in the topics collection.
// For details see: https://github.com/4minitz/4minitz/issues/374
export class MigrateV21 {

    static up() {
        console.log('*** Running Migration V21 ***');
        console.log('Migration V21 recovers info items which are missing in the topics collection due to a bug ' +
            'introduced in migration v18');
        console.log('For details see: https://github.com/4minitz/4minitz/issues/374');
        const minutesHandler = new MinutesHandler();
        const minutesIterator = new MinutesIterator(minutesHandler, MinutesFinder, MeetingSeriesSchema);
        minutesIterator.iterate();
        console.log('*** Finished Migration V21 ***');
    }

    static down() {
        // all good, we do not have to introduce the bug when migrating down ;-)
    }

}

class MinutesHandler {

    constructor() {
        this.itemsDictionary = {};
    }

    finishedSeries(series) {
        this._updateTopicsOfMeetingSeries(series);
        this.itemsDictionary = {};
    }

    _updateTopicsOfMeetingSeries(series) {
        let recoveredItemsCounter = 0;
        const topicsInCollection = TopicsFinder.allTopicsOfMeetingSeries(series._id);
        topicsInCollection.forEach(topicInCollection => {
            topicInCollection.infoItems.forEach(item => {
                delete this.itemsDictionary[item._id];
            });
            const missingItems = this._getMissingItemsForTopic(topicInCollection._id);
            if (missingItems.length > 0) {
                topicInCollection.infoItems = topicInCollection.infoItems.concat(missingItems);
                TopicSchema.getCollection().update(
                    topicInCollection._id,
                    {$set: {infoItems: topicInCollection.infoItems}}
                );
                recoveredItemsCounter += missingItems.length;
            }
        });
        console.log(`MigrationV21: Recovered ${recoveredItemsCounter} missing items`);
    }

    _getMissingItemsForTopic(topicId) {
        const missingItems = Object.keys(this.itemsDictionary)
            .filter(key => this.itemsDictionary[key].parentTopicId === topicId)
            .map(key => {
                const item = this.itemsDictionary[key];
                delete item.parentTopicId;
                return item;
            })
            .reverse();
        missingItems.forEach(item => {
            item.isNew = false;
            if (item.details) {
                item.details.forEach(detail => detail.isNew = false);
            }
        });
        return missingItems;
    }

    nextMinutes(minutes) {
        if (minutes.isFinalized) {
            const itemsDict = this.itemsDictionary;
            minutes.topics = minutes.topics.map(topic => {
                topic.infoItems.forEach(item => {
                    item.parentTopicId = topic._id;
                    itemsDict[item._id] = item;
                });
                return topic;
            });
        }
    }

}
