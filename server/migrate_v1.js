/**
 * Created by felix on 18.05.16.
 */
import { MinutesCollection } from '/imports/collections/minutes_private'

export class MigrateV1 {

    static up() {
        this._updateTopics((topic) => {
            delete topic.priority;
            delete topic.duedate;
            delete topic.details;
            topic.infoItems = [];

            return topic;
        });
    }

    static down() {
        this._updateTopics((topic, minute) => {
            topic.priority = '';
            topic.duedate = currentDatePlusDeltaDays(7, new Date(minute.date));
            topic.details = [
                {
                    date: minute.date,
                    text: ''
                }
            ];
            delete topic.infoItems;

            return topic;
        });
    }

    static _updateTopics(modifyTopic) {
        MinutesCollection.find().forEach(minute => {

            let i = 0;
            minute.topics.forEach((topic) => {

                topic = modifyTopic(topic, minute);

                let sel = 'topics.' + i;
                let setNewTopic = {};
                setNewTopic[sel] = topic;
                MinutesCollection.update(
                    minute._id,
                    {
                        $set: setNewTopic
                    });
                i++;
            });

        });
    }

}