import { MeetingSeriesGenerator } from './generators/meeting-series-generator';
import { MinutesGenerator } from './generators/minutes-generator';

const USER = {_id: 'userId', username: 'username'};

let meetingSeriesGenerator = new MeetingSeriesGenerator(USER);
let series = meetingSeriesGenerator.generate();
let minutesGenerator = new MinutesGenerator({minutesCount: 5}, series._id, USER);
let minutes = minutesGenerator.generate();
meetingSeriesGenerator.addAllMinutes(minutes);


