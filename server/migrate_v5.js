import { MinutesCollection } from '/imports/collections/minutes_private'
import { MeetingSeriesCollection } from '/imports/collections/meetingseries_private'

// convert the participants fields
export class MigrateV5 {

    static _upgradeTopics(topics) {
        // add new field isRecurring with default value false for each topic
        topics.forEach(topic => {
            topic.isRecurring = false;
        });
    }

    static _downgradeTopics(topics) {
        // remove field isSticky for each infoItem in each topic
        topics.forEach(topic => {
            delete topic.isRecurring;
        });
    }


    static up() {
        MinutesCollection.find().forEach(minute => {
            MigrateV5._upgradeTopics(minute.topics);

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
            MigrateV5._upgradeTopics(series.openTopics);
            MigrateV5._upgradeTopics(series.topics);

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
            MigrateV5._downgradeTopics(minute.topics);

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
            MigrateV5._downgradeTopics(series.openTopics);
            MigrateV5._downgradeTopics(series.topics);

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
