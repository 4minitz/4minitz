import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import { GlobalSettings } from '/imports/config/GlobalSettings';

// adds the label field to meeting series, topics and info items
export class MigrateV7 {

    static _upgradeTopics(topics) {
        // add new empty field labels for each infoItem in each topic
        topics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                if (infoItem.labels === undefined) {
                    infoItem.labels = [];
                }
            });
            if (topic.labels === undefined) {
                topic.labels = [];
            }
        });
    }

    static _downgradeTopics(topics) {
        // remove field labels for each infoItem in each topic
        topics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                delete infoItem.labels;
            });
            delete topic.labels;
        });
    }


    static up() {

        MinutesSchema.find().forEach(minute => {
            MigrateV7._upgradeTopics(minute.topics);

            // We use getCollection() here to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id, {
                    $set: {
                        'topics': minute.topics
                    }
                });
        });

        MeetingSeriesSchema.find().forEach(series => {
            MigrateV7._upgradeTopics(series.openTopics);
            MigrateV7._upgradeTopics(series.topics);

            let defaultLabels = GlobalSettings.getDefaultLabels();
            defaultLabels.forEach((label) => {
                label._id = Random.id();
                label.isDefaultLabel = true;
                label.isDisabled = false;
            });

            // We use getCollection() here to skip .clean & .validate to allow empty string values
            MeetingSeriesSchema.getCollection().update(
                series._id, {
                    $set: {
                        'topics': series.topics,
                        'openTopics': series.openTopics,
                        'availableLabels': defaultLabels
                    }
                });
        });
    }

    static down() {
        MinutesSchema.find().forEach(minute => {
            MigrateV7._downgradeTopics(minute.topics);

            // We use getCollection() here to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id, {
                    $set: {
                        'topics': minute.topics
                    }
                });
        });

        MeetingSeriesSchema.find().forEach(series => {
            MigrateV7._downgradeTopics(series.openTopics);
            MigrateV7._downgradeTopics(series.topics);

            // We use getCollection() here to skip .clean & .validate to allow empty string values
            MeetingSeriesSchema.getCollection().update(
                series._id, {
                    $set: {
                        'topics': series.topics,
                        'openTopics': series.openTopics
                    },
                    $unset: {
                        'availableLabels' : ''
                    }
                });
        });
    }
}
