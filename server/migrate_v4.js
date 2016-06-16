import { MinutesCollection } from '/imports/collections/minutes_private'

// convert the responsible (string) => responsibles (array) fields
export class MigrateV4 {

    static up() {
        MinutesCollection.find().forEach(minute => {
            minute.topics.forEach(topic => {
                topic.responsibles = [];
                if (topic.responsible) {
                    topic.responsibles.push(topic.responsible);
                }
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
                minute._id,
                {
                    $set: {topics: minute.topics}
                },
                {bypassCollection2: true}
            );
        });
    }

    static down() {
        MinutesCollection.find().forEach(minute => {
            minute.topics.forEach(topic => {
                delete topic.responsibles;
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
                minute._id,
                {
                    $set: {topics: minute.topics}
                },
                {bypassCollection2: true}
            );
        });
    }
}
