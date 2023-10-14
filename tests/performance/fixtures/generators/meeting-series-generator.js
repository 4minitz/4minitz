import { _ } from "underscore";

import { DateHelper } from "../lib/date-helper";
import { gMSV } from "../lib/gMSV";
import { Random } from "../lib/random";

export class MeetingSeriesGenerator {
  /**
   *
   * @param user             - owner of this series
   * @param user._id
   * @param user.username
   */
  constructor(user) {
    this.user = user;
    this.series = null;
  }

  generate() {
    this.series = {
      _id: Random.generateId(),
      project: gMSV.generateMeetingSeriesValues().project,
      name: gMSV.generateMeetingSeriesValues().name,
      createdAt: new Date(),
      lastMinutesDate: DateHelper.formatDateISO8601(new Date()),
      visibleFor: [this.user._id],
      availableLabels: [],
      minutes: [],
      additionalResponsibles: [],
    };
    return this.series;
  }

  addAllMinutes(minutes) {
    minutes.forEach(_.bind(this.addMinutes, this));
  }

  addMinutes(aMinutes) {
    this.series.minutes.push(aMinutes._id);
    this.series.lastMinutesDate = aMinutes.date;
    this.series.lastMinutesId = aMinutes._id;
    this.series.lastMinutesFinalized = aMinutes.isFinalized;
  }
}
