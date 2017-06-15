import { Meteor } from 'meteor/meteor';
import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import { MinutesFinder } from '/imports/services/minutesFinder';

function saveSeries(series) {
    MeetingSeriesSchema.getCollection().update(
        series._id, {
            $set: {
                'topics': series.topics,
                'openTopics': series.openTopics
            }
        });
}

function saveMinutes(minutes) {
    // We getCollection() here to skip .clean & .validate to allow empty string values
    MinutesSchema.getCollection().update(
        minutes._id, {
            $set: {
                'topics': minutes.topics,
            }
        });
}

class MigrateSeriesUp {
    constructor(series) {
        this.topicParentMinuteMap = {};
        this.series = series;
    }

    run() {
        let minutes = MinutesFinder.firstMinutesOfMeetingSeries(this.series);
        while (minutes) {
            minutes = this._updateTopicsOfMinutes(minutes);
            saveMinutes(minutes);
            minutes = MinutesFinder.nextMinutes(minutes);
        }
        this._updateTopicsOfSeries();
        saveSeries(this.series);
    }

    /**
     * @param minutes {Minutes}
     * @private
     */
    _updateTopicsOfMinutes(minutes) {
        minutes.topics.forEach(topic => {
            this._updateTopic(topic, minutes._id);
        });
        return minutes;
    }

    _updateTopic(topic, minutesId) {
        if (this._isExistingTopic(topic._id)) {
            topic.createdInMinute = this.topicParentMinuteMap[topic._id];
        } else {
            if (!minutesId) {
                throw new Meteor.Error('illegal-state', 'Cannot update topic with unknown minutes id');
            }
            topic.createdInMinute = minutesId;
            this.topicParentMinuteMap[topic._id] = minutesId;
        }
    }

    _isExistingTopic(topicId) {
        return !!this.topicParentMinuteMap[topicId];
    }

    _updateTopicsOfSeries() {
        this.series.topics.forEach(topic => {
            this._updateTopic(topic, false /*all topics should already exist in map!*/);
        });
        this.series.openTopics.forEach(topic => {
            this._updateTopic(topic, false /*all topics should already exist in map!*/);
        });
    }
}

// add "createdInMinute" attribute for topics
// --> update all existing topics in all minutes and meeting series!
export class MigrateV10 {

    static up() {
        console.log('% Progress - updating all topics. This might take several minutes...');
        let allSeries = MeetingSeriesSchema.find();
        allSeries.forEach(series => {
            (new MigrateSeriesUp(series)).run();
        });
    }

    static down() {
        MeetingSeriesSchema.find().forEach(series => {
            series.topics = MigrateV10._downgradeTopics(series.topics);
            series.openTopics = MigrateV10._downgradeTopics(series.openTopics);
            saveSeries(series);
        });
        MinutesSchema.find().forEach(minutes => {
            minutes.topics = MigrateV10._downgradeTopics(minutes.topics);
            saveMinutes(minutes);
        });
    }

    static _downgradeTopics(topics) {
        topics.forEach(topic => {
            delete topic.createdInMinute;
        });
        return topics;
    }
}