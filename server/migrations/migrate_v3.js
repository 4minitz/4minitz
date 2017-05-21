import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';

// convert the participants fields
export class MigrateV3 {

    static _upgradeTopics(topics) {
        // add new field isSticky for each infoItem in each topic
        topics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                if (infoItem.isSticky === undefined) {
                    infoItem.isSticky = false;
                }
            });
        });
    }

    static _downgradeTopics(topics) {
        // remove field isSticky for each infoItem in each topic
        topics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                delete infoItem.isSticky;
            });
        });
    }


    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV3._upgradeTopics(minute.topics);

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
            MigrateV3._upgradeTopics(series.openTopics);
            MigrateV3._upgradeTopics(series.topics);

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
            MigrateV3._downgradeTopics(minute.topics);

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
            MigrateV3._downgradeTopics(series.openTopics);
            MigrateV3._downgradeTopics(series.topics);

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
