import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import { TopicSchema } from '/imports/collections/topic.schema';
import {MinutesFinder} from '../../imports/services/minutesFinder';

// preserve sortOrder of last minute to the topicCollection
export class MigrateV19 {

    static up() {
        let allSeries = MeetingSeriesSchema.getCollection().find();
        allSeries.forEach(series => {
            let minutes = MinutesFinder.lastMinutesOfMeetingSeries(series);
            if (minutes && minutes.isFinalized) {
                let i= 0;
                minutes.topics.forEach(top => {
                    TopicSchema.getCollection().update(
                        top._id,
                        {$set: {sortOrder: i}});
                    i = i +1;
                })
            }
        });
    }

    static down() {
        // delete the sortOrder attribute from all minutes
        TopicSchema.getCollection().update({},
            {$unset: { sortOrder: 0 }},
            {multi: true, bypassCollection2: true});
    }
}
