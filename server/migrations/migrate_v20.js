import { TopicSchema } from '/imports/collections/topic.schema';
import { DetailsSchema } from '/imports/collections/infoitem.schema';
import { MinutesSchema } from '/imports/collections/minutes.schema';

// Details: add field: isNew
export class MigrateV20 {

    static up() {
        let allTopics = TopicSchema.getCollection().find();
        allTopics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                infoItem.details.forEach(detail => {
                    DetailsSchema.getCollection().update(
                        detail._id,
                        {
                            $set: {isNew: false}
                        },
                        {bypassCollection2: true});
                });
            });
        });

        let allMinutes = MinutesSchema.getCollection().find();
        allMinutes.forEach(min => {
            min.topics.forEach(topic => {
                topic.infoItems.forEach(infoItem => {
                    infoItem.details.forEach(detail => {

                        let isNew = (detail.createdInMinute === min._id);
                        DetailsSchema.getCollection().update(
                            detail._id,
                            {
                                $set: {isNew: isNew}
                            },
                            {bypassCollection2: true});
                    });
                });
            });
        });
    }

    static down() {
        DetailsSchema.getCollection().update({},
            {$unset: { isNew: false}},
            {multi: true, bypassCollection2: true});
    }
}