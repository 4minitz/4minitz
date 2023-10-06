

export class MinutesIterator {

    constructor(minutesHandler, minutesFinder, meetingSeriesSchema) {
        this.minutesHandler = minutesHandler;
        this.minutesFinder = minutesFinder;
        this.meetingSeriesSchema = meetingSeriesSchema;
    }

    iterate() {
        const allSeries = this.meetingSeriesSchema.getCollection().find();
        allSeries.forEach(series => {
            this._iterateOverMinutesOfSeries(series);
            this.minutesHandler.finishedSeries(series);
        });
    }

    _iterateOverMinutesOfSeries(series) {
        let minutes = this.minutesFinder.firstMinutesOfMeetingSeries(series);
        while (minutes) {
            this.minutesHandler.nextMinutes(minutes);
            minutes = this.minutesFinder.nextMinutes(minutes);
        }
    }

}
