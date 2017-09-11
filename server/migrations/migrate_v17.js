import { MinutesSchema } from '/imports/collections/minutes.schema';
import { TopicSchema } from '/imports/collections/topic.schema';
import {MinutesFinder} from '../../imports/services/minutesFinder';
import moment from 'moment';

// add "createdAt" and "updatedAt" field for topics
// --> updates all existing topics in all minutes and the topics collection!
export class MigrateV17 {

    static up() {
        const minutesHandler = new MinutesHandler();
        const minutesIterator = new MinutesIterator(minutesHandler);
        minutesIterator.iterate();
    }

    static down() {
        TopicSchema.getCollection().update({}, { $unset: { updatedAt: '', createdAt: '' } });

        MinutesSchema.find().forEach(minutes => {
            minutes.topics = minutes.topics.map(topic => {
                delete topic.updatedAt;
                delete topic.createdAt;
                return topic;
            });
            updateTopicFieldOfMinutes(minutes);
        });
    }

}

class MinutesIterator {

    constructor(minutesHandler) {
        this.minutesHandler = minutesHandler;
    }

    iterate() {
        let allSeries = MeetingSeriesSchema.find();
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
        this.currentMinutes = null;
        this.finalizedTopicsDictionary = {};
        this.realisticCreatedAtDate = null;
    }

    finishedSeries() {
        this._updateTopicsOfMeetingSeries();
        this.finalizedTopicsDictionary = {};
    }

    _updateTopicsOfMeetingSeries() {
        Object.keys(this.finalizedTopicsDictionary).forEach(key => {
            const topic = this.finalizedTopicsDictionary[key];
            TopicSchema.getCollection().update(
                topic._id,
                { $set: { updatedAt: topic.updatedAt, createdAt: topic.createdAt } }
            );
        });
    }

    nextMinutes(minutes) {
        this.currentMinutes = minutes;
        this.realisticCreatedAtDate = this._calcRealisticCreatedAtDate();
        minutes.topics.map(topic => {
            return this._handleTopic(topic);
        });
        updateTopicFieldOfMinutes(minutes);
    }

    _calcRealisticCreatedAtDate() {
        const createdAtDate = moment(this.currentMinutes.createdAt);
        const minutesDate = moment(this.currentMinutes.date);
        return (createdAtDate.diff(minutesDate) > 0) ? createdAtDate.date() : minutesDate.toDate();
    }

    _handleTopic(topic) {
        if (this._isKnownTopic(topic)) {
            topic.createdAt = this.finalizedTopicsDictionary[topic._id].createdAt;
            topic.updatedAt = this.finalizedTopicsDictionary[topic._id].updatedAt;
        } else {
            topic.createdAt = this.realisticCreatedAtDate;
            topic.updatedAt = this.realisticCreatedAtDate;
        }

        if (this.currentMinutes.isFinalized) {
            this.finalizedTopicsDictionary[topic._id] = topic;
        }
        return topic;
    }

    _isKnownTopic(topic) {
        return !!this.finalizedTopicsDictionary[topic._id];
    }

}

function updateTopicFieldOfMinutes(minutes) {
    // We getCollection() here to skip .clean & .validate to allow empty string values
    MinutesSchema.getCollection().update(
        minutes._id, {
            $set: {
                'topics': minutes.topics,
            }
        });
}