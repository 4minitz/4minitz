import { MinutesCollection } from '/imports/collections/minutes_private';
import { MeetingSeriesCollection } from '/imports/collections/meetingseries_private';
import { formatDateISO8601, currentDatePlusDeltaDays } from '/lib/date';

export class MigrateV1 {

    static up() {
        let topicModifier = (topic) => {
            delete topic.priority;
            delete topic.duedate;
            delete topic.details;
            topic.infoItems = [];

            return topic;
        };

        this._updateTopics(topicModifier);
        this._updateMeetingSeries(topicModifier);
    }

    static down() {
        let topicModifier = (topic, minute) => {
            let date = (minute) ? new Date(minute.date) : new Date();

            topic.priority = '';
            topic.duedate = currentDatePlusDeltaDays(7, date);
            topic.details = [{
                date: formatDateISO8601(date),
                text: ''
            }];
            delete topic.infoItems;

            return topic;
        };

        this._updateTopics(topicModifier);
        this._updateMeetingSeries(topicModifier);
    }

    static _updateTopics(modifyTopic) {
        MinutesCollection.find().forEach(minute => {

            minute.topics.forEach((topic, index) => {
                topic = modifyTopic(topic, minute);

                let sel = 'topics.' + index;
                let setNewTopic = {};
                setNewTopic[sel] = topic;
                MinutesCollection.update(
                    minute._id,
                    {
                        $set: setNewTopic
                    });
            });

        });
    }

    static _updateMeetingSeries(modifyTopic) {
        MeetingSeriesCollection.find().forEach(series => {

            let iterateTopics = (propertyName) => {
                return (topic, index) => {
                    topic = modifyTopic(topic);

                    let sel = propertyName + '.' + index;
                    let setNewTopic = {};
                    setNewTopic[sel] = topic;
                    MeetingSeriesCollection.update(
                        series._id,
                        {
                            $set: setNewTopic
                        });
                };
            };

            series.openTopics.forEach(iterateTopics('openTopics'));
            series.closedTopics.forEach(iterateTopics('closedTopics'));
        });
    }

}