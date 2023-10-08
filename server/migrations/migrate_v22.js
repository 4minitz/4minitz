import { MeetingSeriesSchema } from "/imports/collections/meetingseries.schema";
import { TopicSchema } from "/imports/collections/topic.schema";

export class MigrateV22 {
  static up() {
    const handler = new TopicsHandler(
      TopicSchema.getCollection(),
      MeetingSeriesSchema.getCollection(),
    );
    handler.iterateOverTopics();
  }

  static down() {
    TopicSchema.getCollection().update(
      {},
      { $unset: { visibleFor: "" } },
      { bypassCollection2: true, multi: true },
    );
  }
}

class TopicsHandler {
  constructor(topicsCollection, meetingSeriesCollection) {
    this.topicsCollection = topicsCollection;
    this.meetingSeriesCollection = meetingSeriesCollection;
    /**
     * Dictionary containing the visiblyFor-Array
     * for each series id, which we have already visited.
     * @type {Object.<string, string[]>}
     */
    this.visibilityDict = {};
  }

  iterateOverTopics() {
    this.topicsCollection.find().forEach((topic) => {
      const relatedSeriesId = topic.parentId;
      const visibleFor = this._determineAllowedUsersOfSeries(relatedSeriesId);
      this._updateTopicsVisibleForField(topic, visibleFor);
    });
  }

  _determineAllowedUsersOfSeries(seriesId) {
    let visibleFor = this._getCachedVisibleForUsers(seriesId);
    if (!visibleFor) {
      visibleFor = this._queryVisibleFor(seriesId);
    }
    return visibleFor;
  }

  _getCachedVisibleForUsers(seriesId) {
    return this.visibilityDict[seriesId];
  }

  _queryVisibleFor(seriesId) {
    const series = this.meetingSeriesCollection.findOne(seriesId);
    this.visibilityDict[seriesId] = series.visibleFor;
    return series.visibleFor;
  }

  _updateTopicsVisibleForField(topic, visibleFor) {
    this.topicsCollection.update(
      topic._id,
      { $set: { visibleFor } },
      { bypassCollection2: true },
    );
  }
}
