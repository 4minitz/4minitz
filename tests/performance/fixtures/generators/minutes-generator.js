import { Random } from "../lib/random";
import moment from "moment/moment";
import { DateHelper } from "../lib/date-helper";

export class MinutesGenerator {
  /**
   *
   * @param config                        - Configuration
   * @param config.minutesCount {number}  - amount of minutes which should be generated
   * @param parentSeriesId
   * @param user                          - owner of the minutes
   * @param user._id
   * @param user.username
   * @param nextMinutesDate
   */
  constructor(config, parentSeriesId, user, nextMinutesDate = null) {
    if (nextMinutesDate === null) {
      nextMinutesDate = new Date();
    }
    this.config = config;
    this.parentSeriesId = parentSeriesId;
    this.user = user;
    this.nextMinutesDate = nextMinutesDate;
  }

  /**
   *
   * @param topicsGenerator {TopicsGenerator}
   * @returns {Array}
   */
  generate(topicsGenerator) {
    let result = [];
    let lastMin = false;
    for (let i = 0; i < this.config.minutesCount; i++) {
      let isLastOne = i + 1 === this.config.minutesCount;
      lastMin = this.generateOne(topicsGenerator, isLastOne);
      result.push(lastMin);
      this._tickOneDay();
    }

    return result;
  }

  generateOne(topicsGenerator, isLastOne = false) {
    let id = Random.generateId();
    let min = {
      _id: id,
      meetingSeries_id: this.parentSeriesId,
      date: this.constructor._formatDate(this.nextMinutesDate),
      topics: topicsGenerator.generateNextListForMinutes(
        id,
        this.nextMinutesDate,
        isLastOne,
      ),
      visibleFor: [this.user._id],
      participants: [
        { userId: this.user._id, present: false, minuteKeeper: false },
      ],
      createdAt: new Date(),
      createdBy: this.user.username,
      isFinalized: !isLastOne,
      globalNote: "",
      participantsAdditional: "",
      finalizedVersion: isLastOne ? 0 : 1,
      finalizedHistory: [],
      agenda: "",
    };

    if (!isLastOne) {
      min.finalizedAt = this.nextMinutesDate;
      min.finalizedBy = this.user.username;
      let dateTime = this.constructor._formatDateTime(this.nextMinutesDate);

      // #I18N: We will leave this is English, as it is published to the database!
      min.finalizedHistory.push(
        `Version 1. Finalized on ${dateTime} by ${this.user.username}`,
      );
    }
    return min;
  }

  _tickOneDay() {
    this.nextMinutesDate = moment(this.nextMinutesDate).add(1, "days").toDate();
  }

  static _formatDate(date) {
    return DateHelper.formatDateISO8601(date);
  }

  static _formatDateTime(date) {
    return DateHelper.formatDateISO8601Time(date);
  }
}
