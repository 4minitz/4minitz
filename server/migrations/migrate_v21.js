import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import { TopicSchema } from '/imports/collections/topic.schema';
import {MinutesFinder} from '../../imports/services/minutesFinder';
import {TopicsFinder} from '../../imports/services/topicsFinder';

// This Migration corrects the bug introduced in MigrationV18
// MigrationV18 removes some items in the topics collection.
// For details see: https://github.com/4minitz/4minitz/issues/374
export class MigrateV21 {

    static up() {
        const minutesHandler = new MinutesHandler();
        const minutesIterator = new MinutesIterator(minutesHandler);
        minutesIterator.iterate();
    }

    static down() {
        // all good, we do not have to introduce the bug when migrating down ;-)
    }

}

class MinutesIterator {

    constructor(minutesHandler) {
        this.minutesHandler = minutesHandler;
    }

    iterate() {
        let allSeries = MeetingSeriesSchema.getCollection().find();
        allSeries.forEach(series => {
            this._iterateOverMinutesOfSeries(series);
            this.minutesHandler.finishedSeries(series);
        });
    }

    _iterateOverMinutesOfSeries(series) {
        let minutes = MinutesFinder.firstMinutesOfMeetingSeries(series);
        while (minutes) {
            this.minutesHandler.nextMinutes(minutes);
            minutes = MinutesFinder.nextMinutes(minutes);
        }
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
        const topicsInCollection = TopicsFinder.allTopicsOfMeetingSeries(series._id);
        topicsInCollection.forEach(topicInCollection => {
            topicInCollection.infoItems.forEach(item => {
                delete this.itemsDictionary[item._id];
            });
            const missingItems = Object.keys(this.itemsDictionary).map(key => this.itemsDictionary[key]);
            missingItems.forEach(item => {
                item.isNew = false;
                item.details.forEach(detail => detail.isNew = false);
            });
            topicInCollection.infoItems = topicInCollection.infoItems.concat(missingItems);
            TopicSchema.getCollection().update(
                topicInCollection._id,
                { $set: { infoItems: topicInCollection.infoItems } }
            );
        });
    }

    nextMinutes(minutes) {
        if (minutes.isFinalized) {
            const itemsDict = this.itemsDictionary;
            minutes.topics = minutes.topics.map(topic => {
                topic.infoItems.forEach(item => itemsDict[item._id] = item);
                return topic;
            });
        }
    }

}
