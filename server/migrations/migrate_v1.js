import { MeetingSeriesSchema } from "/imports/collections/meetingseries.schema";
import { MinutesSchema } from "/imports/collections/minutes.schema";
import {
  currentDatePlusDeltaDays,
  formatDateISO8601,
} from "/imports/helpers/date";

export class MigrateV1 {
  static up() {
    const topicModifier = (topic) => {
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
    const topicModifier = (topic, minute) => {
      const date = minute ? new Date(minute.date) : new Date();

      topic.priority = "";
      topic.duedate = currentDatePlusDeltaDays(7, date);
      topic.details = [{ date: formatDateISO8601(date), text: "" }];
      delete topic.infoItems;

      return topic;
    };

    this._updateTopics(topicModifier);
    this._updateMeetingSeries(topicModifier);
  }

  static _updateTopics(modifyTopic) {
    MinutesSchema.getCollection()
      .find()
      .forEach((minute) => {
        minute.topics.forEach((topic, index) => {
          topic = modifyTopic(topic, minute);

          const sel = `topics.${index}`;
          const setNewTopic = {};
          setNewTopic[sel] = topic;
          MinutesSchema.getCollection().update(minute._id, {
            $set: setNewTopic,
          });
        });
      });
  }

  static _updateMeetingSeries(modifyTopic) {
    MeetingSeriesSchema.getCollection()
      .find()
      .forEach((series) => {
        const iterateTopics = (propertyName) => {
          return (topic, index) => {
            topic = modifyTopic(topic);

            const sel = `${propertyName}.${index}`;
            const setNewTopic = {};
            setNewTopic[sel] = topic;
            MeetingSeriesSchema.getCollection().update(series._id, {
              $set: setNewTopic,
            });
          };
        };

        series.openTopics.forEach(iterateTopics("openTopics"));
        if (series.closedTopics) {
          series.closedTopics.forEach(iterateTopics("closedTopics"));
        }
      });
  }
}
