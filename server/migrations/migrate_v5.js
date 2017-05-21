import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';

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
        MinutesSchema.find().forEach(minute => {
            MigrateV5._upgradeTopics(minute.topics);

            // We use getCollection() here to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id, {
                    $set: {
                        'topics': minute.topics
                    }
                });
        });

        MeetingSeriesSchema.find().forEach(series => {
            MigrateV5._upgradeTopics(series.openTopics);
            MigrateV5._upgradeTopics(series.topics);

            MeetingSeriesSchema.getCollection().update(
                series._id, {
                    $set: {
                        'topics': series.topics,
                        'openTopics': series.openTopics
                    }
                });
        });
    }

    static down() {
        MinutesSchema.find().forEach(minute => {
            MigrateV5._downgradeTopics(minute.topics);

            // We use getCollection() here to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id, {
                    $set: {
                        'topics': minute.topics
                    }
                });
        });

        MeetingSeriesSchema.find().forEach(series => {
            MigrateV5._downgradeTopics(series.openTopics);
            MigrateV5._downgradeTopics(series.topics);

            MeetingSeriesSchema.getCollection().update(
                series._id, {
                    $set: {
                        'topics': series.topics,
                        'openTopics': series.openTopics
                    }
                });
        });
    }
}
