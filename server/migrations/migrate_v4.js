import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';

// Topics: convert the responsible (string) => responsibles (array) fields
export class MigrateV4 {

    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            minute.topics.forEach(topic => {
                topic.responsibles = [];
                if (topic.responsible) {
                    topic.responsibles.push(topic.responsible);
                }
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $set: {topics: minute.topics}
                },
                {bypassCollection2: true}
            );
        });
        MeetingSeriesSchema.getCollection().find().forEach(meeting => {
            meeting.topics.forEach(topic => {
                topic.responsibles = [];
                if (topic.responsible) {
                    topic.responsibles.push(topic.responsible);
                }
            });
            meeting.openTopics.forEach(topic => {
                topic.responsibles = [];
                if (topic.responsible) {
                    topic.responsibles.push(topic.responsible);
                }
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MeetingSeriesSchema.getCollection().update(
                meeting._id,
                {
                    $set: {topics:    meeting.topics,
                        openTopics: meeting.openTopics}
                },
                {bypassCollection2: true}
            );
        });

    }

    static down() {
        MinutesSchema.getCollection().find().forEach(minute => {
            minute.topics.forEach(topic => {
                delete topic.responsibles;
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $set: {topics: minute.topics}
                },
                {bypassCollection2: true}
            );
        });

        MeetingSeriesSchema.getCollection().find().forEach(meeting => {
            meeting.topics.forEach(topic => {
                if (topic.responsibles) {
                    topic.responsible = topic.responsibles.join();
                    delete topic.responsibles;
                }
            });
            meeting.openTopics.forEach(topic => {
                if (topic.responsibles) {
                    topic.responsible = topic.responsibles.join();
                    delete topic.responsibles;
                }
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MeetingSeriesSchema.getCollection().update(
                meeting._id,
                {
                    $set: {topics:     meeting.topics,
                        openTopics: meeting.openTopics}
                },
                {bypassCollection2: true}
            );
        });
    }
}
