import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import {updateTopicsOfSeriesPre16} from './helpers/updateSeries';
import {updateTopicsOfMinutes} from './helpers/updateMinutes';

// Topics: convert the responsible (string) => responsibles (array) fields
export class MigrateV4 {

    static up() {
        const migrateTopicsUp = (topic) => {
            topic.responsibles = [];
            if (topic.responsible) {
                topic.responsibles.push(topic.responsible);
            }
        };

        MinutesSchema.getCollection().find().forEach(minute => {
            minute.topics.forEach(migrateTopicsUp);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection(), {bypassCollection2: true});
        });
        MeetingSeriesSchema.getCollection().find().forEach(meeting => {
            meeting.topics.forEach(migrateTopicsUp);
            meeting.openTopics.forEach(migrateTopicsUp);

            updateTopicsOfSeriesPre16(meeting, MeetingSeriesSchema.getCollection(), {bypassCollection2: true});
        });

    }

    static down() {
        const migrateTopicsDown = (topic) => {
            if (topic.responsibles) {
                topic.responsible = topic.responsibles.join();
                delete topic.responsibles;
            }
        };

        MinutesSchema.getCollection().find().forEach(minute => {
            minute.topics.forEach(migrateTopicsDown);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection(), {bypassCollection2: true});
        });

        MeetingSeriesSchema.getCollection().find().forEach(meeting => {
            meeting.topics.forEach(migrateTopicsDown);
            meeting.openTopics.forEach(migrateTopicsDown);

            updateTopicsOfSeriesPre16(meeting, MeetingSeriesSchema.getCollection(), {bypassCollection2: true});
        });
    }
}
