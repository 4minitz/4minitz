import { _ } from 'underscore';
import { Random } from '../lib/random';
import { DateHelper } from '../lib/date-helper';

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
            project: Random.generateMeetingSeriesValues().project,
            name: Random.generateMeetingSeriesValues().name,
            createdAt: new Date(),
            lastMinutesDate: DateHelper.formatDateISO8601(new Date()),
            visibleFor: [this.user._id],
            availableLabels: [],
            minutes: [],
            openTopics: [],
            topics: [],
            additionalResponsibles: []
        };
        return this.series;
    }

    addAllMinutes(minutes, seriesTopicList = []) {
        minutes.forEach(_.bind(this.addMinutes, this));
        this.series.topics = seriesTopicList;
    }

    addMinutes(aMinutes) {
        this.series.minutes.push(aMinutes._id);
        this.series.lastMinutesDate = aMinutes.date;
        this.series.lastMinutesId = aMinutes._id;
        this.series.lastMinutesFinalized = aMinutes.isFinalized;
    }
}