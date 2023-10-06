import { MeetingSeriesGenerator } from '../generators/meeting-series-generator';
import { MinutesGenerator } from '../generators/minutes-generator';
import { TopicsGenerator } from '../generators/topics-generator';

let expect = require('chai').expect;



describe('Generate Data', function() {

    it('should not fail', function() {
        let user = {_id: 'userId', username: 'username'};
        let meetingSeriesGenerator = new MeetingSeriesGenerator(user);
        let series = meetingSeriesGenerator.generate();
        let minutesGenerator = new MinutesGenerator({minutesCount: 5}, series._id, user);
        let topicsGenerator = new TopicsGenerator(
            {topicsRange: {min: 3, max: 10}, itemsRange: {min: 1, max: 8}, detailsSentenceRange: {min: 7, max: 23}});
        let minutes = minutesGenerator.generate(topicsGenerator);
        meetingSeriesGenerator.addAllMinutes(minutes, topicsGenerator.seriesTopicList);
    });



});
