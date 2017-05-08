import { MinutesCollection } from '/imports/collections/minutes_private'
import { MeetingSeriesCollection } from '/imports/collections/meetingseries_private'

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
        MinutesCollection.find().forEach(minute => {
            MigrateV13._upgradeTopics(minute.topics);

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
            MigrateV13._upgradeTopics(series.openTopics);
            MigrateV13._upgradeTopics(series.topics);

            MeetingSeriesCollection.update(
                series._id,
                {
                    $set: {
                        "topics": series.topics,
                        "openTopics": series.openTopics
                    }
                },
                {bypassCollection2: true}
            )
        })
    }

    static down() {
        MinutesCollection.find().forEach(minute => {
            MigrateV13._downgradeTopics(minute.topics);

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
            MigrateV13._downgradeTopics(series.openTopics);
            MigrateV13._downgradeTopics(series.topics);

            MeetingSeriesCollection.update(
                series._id,
                {
                    $set: {
                        "topics": series.topics,
                        "openTopics": series.openTopics
                    }
                },
                {bypassCollection2: true}
            )
        })
    }
}
