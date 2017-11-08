import { TopicSchema } from '/imports/collections/topic.schema';
import { MinutesSchema } from '/imports/collections/minutes.schema';

function saveMinutes(minutes) {
    MinutesSchema.getCollection().update(
        minutes._id, {
            $set: {
                'topics': minutes.topics,
            }
        },
        {bypassCollection2: true}
    );
}

function saveTopics(topics) {
    TopicSchema.getCollection().update(
        topics._id, {
            $set: {
                'infoItems': topics.infoItems,
            }
        },
        {bypassCollection2: true}
    );
}

function forEachDetailInTopics(topics, operation){
    topics.forEach(topic =>{
        topic.infoItems.forEach(infoItem => {
            if(infoItem.details) {
                infoItem.details.forEach(operation);
            }
        });
    });
}

function forEachDetailInMinutes(minutes, operation) {
    minutes.forEach(min => {
        forEachDetailInTopics(min.topics, operation);
    });
}

// Details: add field: isNew
export class MigrateV20 {

    static up() {
        let allTopics = TopicSchema.getCollection().find();
        forEachDetailInTopics(allTopics, detail => {
            detail.isNew = false;
        });
        saveTopics(allTopics);

        let allMinutes = MinutesSchema.getCollection().find();
        allMinutes.forEach(min => {
            forEachDetailInTopics(min.topics, detail => {
                detail.isNew = (detail.createdInMinute === min._id);
            });
        });
        saveMinutes(allMinutes);
    }

    static down() {
        let allTopics = TopicSchema.getCollection().find();
        forEachDetailInTopics(allTopics, detail => {
            delete detail.isNew;
        });
        saveTopics(allTopics);

        let allMinutes = MinutesSchema.getCollection().find();
        forEachDetailInMinutes(allMinutes, detail => {
            delete detail.isNew;
        });
        saveMinutes(allMinutes);
    }
}