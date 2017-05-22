import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';

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

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $set: {
                        'topics': minute.topics
                    }
                },
                {bypassCollection2: true}
            );
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV13._upgradeTopics(series.openTopics);
            MigrateV13._upgradeTopics(series.topics);

            MeetingSeriesSchema.getCollection().update(
                series._id,
                {
                    $set: {
                        'topics': series.topics,
                        'openTopics': series.openTopics
                    }
                },
                {bypassCollection2: true}
            );
        });
    }

    static down() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV13._downgradeTopics(minute.topics);

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $set: {
                        'topics': minute.topics
                    }
                },
                {bypassCollection2: true}
            );
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV13._downgradeTopics(series.openTopics);
            MigrateV13._downgradeTopics(series.topics);

            MeetingSeriesSchema.getCollection().update(
                series._id,
                {
                    $set: {
                        'topics': series.topics,
                        'openTopics': series.openTopics
                    }
                },
                {bypassCollection2: true}
            );
        });
    }
}
