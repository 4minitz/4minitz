import { TopicSchema } from '/imports/collections/topic.schema';
import { MinutesSchema } from '/imports/collections/minutes.schema';

function saveMinutes(minutes) {
    // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
    MinutesSchema.getCollection().update(
        minutes._id, {
            $set: {
                'topics': minutes.topics,
            }
        }
    );
}

function saveTopics(topics) {
    TopicSchema.getCollection().update(
        topics._id, {
            $set: {
                'infoItems': topics.infoItems,
            }
        }
    );
}

function forEachDetailInTopics(topics, operation){
    topics.forEach(topic =>{
        topic.infoItems.forEach(infoItem => {
            infoItem.details.forEach(operation);
        });
    });
}

function forEachDetailInMinutes(minutes, operation) {
    minutes.forEach(min => {
        min.topics.forEach(topic => {
            topic.infoItems.forEach(infoItem => {
                infoItem.details.forEach(operation);
            });
        });
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
                let isNew = (detail.createdInMinute === min._id);
                detail.isNew = isNew;
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