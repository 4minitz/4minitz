import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import {updateTopicsOfMinutes} from './helpers/updateMinutes';
import {updateTopicsOfSeriesPre16} from './helpers/updateSeries';

export class MigrateV13 {

    static _upgradeTopics(topics) {
        topics.forEach(topic => {
            if (topic.isSkipped === undefined) {
                topic.isSkipped = false;
            }
        });
    }

    static _downgradeTopics(topics) {
        topics.forEach(topic => {
            delete topic.isSkipped;
        });
    }

    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV13._upgradeTopics(minute.topics);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection(), {bypassCollection2: true});
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV13._upgradeTopics(series.openTopics);
            MigrateV13._upgradeTopics(series.topics);
            updateTopicsOfSeriesPre16(series, MeetingSeriesSchema.getCollection(), {bypassCollection2: true});
        });
    }

    static down() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV13._downgradeTopics(minute.topics);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection(), {bypassCollection2: true});
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV13._downgradeTopics(series.openTopics);
            MigrateV13._downgradeTopics(series.topics);
            updateTopicsOfSeriesPre16(series, MeetingSeriesSchema.getCollection(), {bypassCollection2: true});
        });
    }
}
