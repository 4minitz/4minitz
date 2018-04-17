import { MinutesSchema } from '/imports/collections/minutes.schema';

export class MigrateV24 {
    static fixItem(infoOrActionItem) {
        // the objects we get passed in from the database look fine
        // but if we just store them back in the database they are EJSON
        // objects again. Maybe there is some metadata attached to them?
        // Copying their properties with Object.assign() or using the
        // spread operator gets rid of that metadata.
        return {...infoOrActionItem};
    }

    static fixTopic(topic) {
        const fixedInfoItems = topic.infoItems.map(item => this.fixItem(item));
        return {...topic, infoItems: fixedInfoItems};
    }

    static migrateMinutesCollection() {
        let minutes = MinutesSchema.getCollection().find({});
        minutes.forEach(singleMinute => {
            let topics = singleMinute.topics.map(topic => this.fixTopic(topic));
            MinutesSchema.getCollection().update(singleMinute._id, {$set: {topics}});
        });
    }

    static up() {
        this.migrateMinutesCollection();
    }

    static down() {
        // This migration fixes a bug introduced in migration #23.
        // Due to the fact that initially migration #23 did not find() minutes on the
        // collection but on the MinutesSchema the return value was not a plain minutes
        // document. Instead it contained astronomy classes, e.g. InfoItemSchema in
        // topics.$.infoItems. This breaks the database.
        // Migration #23 is fixed now and we don't want to break database when downgrading
        // from #24 to #23.
    }
}
