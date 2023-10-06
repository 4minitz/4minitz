import { TopicSchema } from '../../imports/collections/topic.schema';
import { MeetingSeriesSchema } from '../../imports/collections/meetingseries.schema';

// Move meeting series topics list into own topics collection
// Delete fields meetingSeries.openTopics / meetingSeries.topics

export class MigrateV16 {

    static up() {
        MeetingSeriesSchema.getCollection().find().forEach(series => {
            const meetingSeriesId = series._id;

            series.topics.reverse().forEach(topic => {
                topic.parentId = meetingSeriesId;
                TopicSchema.getCollection().insert(topic);
            });

            MeetingSeriesSchema.getCollection().update(
                series._id,
                {
                    $unset: {
                        'topics': '',
                        'openTopics': ''
                    }
                },
                {bypassCollection2: true}
            );
        });
    }

    static down() {
        MeetingSeriesSchema.getCollection().find().forEach(series => {
            const topicsOfSeries = [];
            const openTopicsOfSeries = [];
            TopicSchema.getCollection().find({ parentId: series._id}).forEach(topic => {
                topicsOfSeries.unshift(topic);
                if (topic.isOpen) {
                    openTopicsOfSeries.unshift(topic);
                }
            });

            MeetingSeriesSchema.getCollection().update(
                series._id,
                {
                    $set: {
                        'topics': topicsOfSeries,
                        'openTopics': openTopicsOfSeries
                    }
                },
                {bypassCollection2: true}
            );
        });

        TopicSchema.getCollection().remove({});
    }

}
