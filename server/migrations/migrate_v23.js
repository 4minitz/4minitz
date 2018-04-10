import { TopicSchema } from '/imports/collections/topic.schema';
import { MinutesSchema } from '/imports/collections/minutes.schema';

const bypass = {bypassCollection2: true};

export class MigrateV23 {
    static migrateTopicCollection() {
        let topics = TopicSchema.find({});

        topics.forEach(topic => {
            if (Array.isArray(topic.responsibles)) {
                return;
            }

            const responsibles = [];
            TopicSchema.update(topic._id, {$set: {responsibles}}, bypass);
        });
    }

    static migrateMinutesCollection() {
        let minutes = MinutesSchema.find({});
        minutes.forEach(minutes => {
            let topics = minutes.topics.map(topic => ({...topic, responsibles: topic.responsibles || []}));
            MinutesSchema.update(minutes._id, {$set: {topics}}, bypass);
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
