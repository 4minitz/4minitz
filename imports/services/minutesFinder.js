import { MeetingSeriesSchema } from '../collections/meetingseries.schema';
import { MinutesSchema } from '../collections/minutes.schema';
import { Minutes } from '../minutes';

import { instanceCheck } from '../helpers/check';

export class MinutesFinder {
    static allMinutesOfMeetingSeries(meetingSeries, limit, descending = true) {
        instanceCheck(meetingSeries, MeetingSeriesSchema);

        const minutesIds = meetingSeries.minutes;
        if (!Array.isArray(minutesIds) || minutesIds.length === 0) {
            return [];
        }

        let sort = descending ? -1 : 1;
        let options = {sort: {date: sort}};
        if (limit) {
            options.limit = limit;
        }

        return MinutesSchema.find({_id: {$in: minutesIds}}, options)
            .map(m => new Minutes(m));
    }
}