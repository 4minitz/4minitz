import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import {updateTopicsOfMinutes} from './helpers/updateMinutes';
import {updateTopicsOfSeriesPre16} from './helpers/updateSeries';

// add the isRecurring field to all topics
export class MigrateV5 {

    static _upgradeTopics(topics) {
        // add new field isRecurring with default value false for each topic
        topics.forEach(topic => {
            topic.isRecurring = false;
        });
    }

    static _downgradeTopics(topics) {
        // remove field isRecurring for each infoItem in each topic
        topics.forEach(topic => {
            delete topic.isRecurring;
        });
    }


    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV5._upgradeTopics(minute.topics);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection());
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV5._upgradeTopics(series.openTopics);
            MigrateV5._upgradeTopics(series.topics);
            updateTopicsOfSeriesPre16(series, MeetingSeriesSchema.getCollection());
        });
    }

    static down() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV5._downgradeTopics(minute.topics);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection());
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV5._downgradeTopics(series.openTopics);
            MigrateV5._downgradeTopics(series.topics);
            updateTopicsOfSeriesPre16(series, MeetingSeriesSchema.getCollection());
        });
    }
}
