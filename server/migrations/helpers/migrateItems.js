import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';

/**
 * Migrates all items of topics within minutes AND series.
 *
 * CAUTION: Since MigrationV16 the meeting series topics are stored in their own
 * collection and not as subdocuments of the meeting series anymore. This means that
 * we have to adjust this class if we want to use it for later migrations, too.
 */
export class MigrateItemsPre16 {

    constructor(convertItem) {
        this.convertItem = convertItem;
        this._doMigration();
    }

    _doMigration() {
        MinutesSchema.getCollection().find().forEach(minute => {
            this._migrateTopics(minute.topics);

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
            this._migrateTopics(series.openTopics);
            this._migrateTopics(series.topics);

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

    _migrateTopics(topics) {
        if (!this.convertItem) {
            throw new Error('illegal-state: You must pass a converter function');
        }
        topics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                this.convertItem(infoItem);
            });
        });
    }

}