import { MinutesSchema } from '../collections/minutes.schema';
import { Minutes } from '../minutes';

export class MinutesFinder {
    static allMinutesOfMeetingSeries(meetingSeries, limit, descendingByDate = true) {

        if (meetingSeries === undefined) {
            return [];
        }

        const minutesIds = meetingSeries.minutes;


        if (!Array.isArray(minutesIds) || minutesIds.length === 0) {
            return [];
        }

        let sort = descendingByDate ? -1 : 1;
        let options = {sort: {date: sort}};
        if (limit) {
            options.limit = limit;
        }

        // @todo use minutes schema directly? 
        return MinutesSchema.getCollection().find({_id: {$in: minutesIds}}, options)
            .map(doc => new Minutes(doc));
    }

    static _getCornerMinutes(meetingSeries, limit, descendingByDate = true) {
        if (!Array.isArray(meetingSeries.minutes) || meetingSeries.minutes.length < limit) {
            return false;
        }

        let minutes = this.allMinutesOfMeetingSeries(meetingSeries, limit, descendingByDate);
        if (minutes && minutes.length === limit) {
            return minutes[limit-1];
        }

        return false;
    }

    static firstMinutesOfMeetingSeries(meetingSeries) {
        const descendingByDate = false;
        return this._getCornerMinutes(meetingSeries, 1, descendingByDate);
    }

    static lastMinutesOfMeetingSeries(meetingSeries) {
        const descendingByDate = true;
        return this._getCornerMinutes(meetingSeries, 1, descendingByDate);
    }

    static lastFinalizedMinutesOfMeetingSeries(meetingSeries) {
        let lastMinute = this.lastMinutesOfMeetingSeries(meetingSeries);
        if(lastMinute.isFinalized)
            return lastMinute;
        else
            return this.secondLastMinutesOfMeetingSeries(meetingSeries);
    }

    static secondLastMinutesOfMeetingSeries(meetingSeries) {
        const descendingByDate = true;
        return this._getCornerMinutes(meetingSeries, 2, descendingByDate);
    }

    static _getNeighborMinutes(minutes, offset) {
        const parentSeries = minutes.parentMeetingSeries(),
            myPosition = parentSeries.minutes.indexOf(minutes._id),
            neighborPosition = myPosition + offset;

        if (neighborPosition > -1 && neighborPosition < parentSeries.minutes.length) {
            let neighborMinutesId = parentSeries.minutes[neighborPosition];
            return new Minutes(neighborMinutesId);
        }

        return false;
    }

    static nextMinutes(minutes) {
        return this._getNeighborMinutes(minutes, 1);
    }

    static previousMinutes(minutes) {
        return this._getNeighborMinutes(minutes, -1);
    }

}