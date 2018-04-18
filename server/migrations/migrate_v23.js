import { TopicSchema } from '/imports/collections/topic.schema';
import { MinutesSchema } from '/imports/collections/minutes.schema';

export class MigrateV23 {
    static migrateTopicCollection() {
        let topics = TopicSchema.getCollection().find({});

        topics.forEach(topic => {
            if (Array.isArray(topic.responsibles)) {
                return;
            }

            const responsibles = [];
            TopicSchema.getCollection().update(topic._id, {$set: {responsibles}});
        });
    }

    static migrateMinutesCollection() {
        let minutes = MinutesSchema.getCollection().find({});
        minutes.forEach(minutes => {
            // copy over the topics as they are and just replace the responsibles field:
            //  * keep responsibles if they are set properly
            //  * set responsibles to [] if they are null
            let topics = minutes.topics.map(topic => ({...topic, responsibles: topic.responsibles || []}));
            MinutesSchema.getCollection().update(minutes._id, {$set: {topics}});
        });
    }

    static up() {
        this.migrateTopicCollection();
        this.migrateMinutesCollection();
    }

    static down() {
        // the old schema also supports responsibles fields set to an empty array
        // so there is nothing to do here
    }
}
