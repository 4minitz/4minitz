import { MinutesCollection } from '/imports/collections/minutes_private'
import { MeetingSeriesCollection } from '/imports/collections/meetingseries_private'
import { GlobalSettings } from '/imports/GlobalSettings'

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

        MinutesCollection.find().forEach(minute => {
            MigrateV7._upgradeTopics(minute.topics);

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
                minute._id,
                {
                    $set: {
                        "topics": minute.topics
                    }
                },
                {bypassCollection2: true}
            );
        });

        MeetingSeriesCollection.find().forEach(series => {
            MigrateV7._upgradeTopics(series.openTopics);
            MigrateV7._upgradeTopics(series.topics);

            let defaultLabels = GlobalSettings.getDefaultLabels();
            defaultLabels.forEach((label) => {
                label._id = Random.id();
                label.isDefaultLabel = true;
                label.isDisabled = false;
            });

            MeetingSeriesCollection.update(
                series._id,
                {
                    $set: {
                        "topics": series.topics,
                        "openTopics": series.openTopics,
                        "availableLabels": defaultLabels
                    }
                },
                {bypassCollection2: true}
            )
        })
    }

    static down() {
        MinutesCollection.find().forEach(minute => {
            MigrateV7._downgradeTopics(minute.topics);

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
                minute._id,
                {
                    $set: {
                        "topics": minute.topics
                    }
                },
                {bypassCollection2: true}
            );
        });

        MeetingSeriesCollection.find().forEach(series => {
            MigrateV7._downgradeTopics(series.openTopics);
            MigrateV7._downgradeTopics(series.topics);

            MeetingSeriesCollection.update(
                series._id,
                {
                    $set: {
                        "topics": series.topics,
                        "openTopics": series.openTopics
                    },
                    $unset: {
                        "availableLabels" : ""
                    }
                },
                {bypassCollection2: true}
            )
        })
    }
}
