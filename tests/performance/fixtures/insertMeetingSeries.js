import { MeetingSeriesGenerator } from './generators/meeting-series-generator';
import { MinutesGenerator } from './generators/minutes-generator';
import { TopicsGenerator } from './generators/topics-generator';
import { MongoDb } from './lib/mongo-db';
import { Collections } from './lib/mongo-db';


const USERNAME = 'user1';
const MONGO_URL = 'mongodb://localhost:3101/meteor';


async function main() {
    try {
        // set up the database
        let mongoDb = new MongoDb(MONGO_URL);
        await mongoDb.connect();

        // Find user id
        let user = await mongoDb.findOne('users', {username: USERNAME});

        // Generate the data
        let meetingSeriesGenerator = new MeetingSeriesGenerator(user);
        let series = meetingSeriesGenerator.generate();
        let minutesGenerator = new MinutesGenerator({minutesCount: 5}, series._id, user);
        let topicsGenerator = new TopicsGenerator({topicsRange: {min: 3, max: 10}, itemsRange: {min: 1, max: 8}});
        let minutes = minutesGenerator.generate(topicsGenerator);
        meetingSeriesGenerator.addAllMinutes(minutes, topicsGenerator.seriesTopicList);

        await mongoDb.insertOne(Collections.MeetingSeries, series);
        let count = (await mongoDb.insertMany(Collections.Minutes, minutes)).insertedCount;


        // Add Role Moderator for User
        let role = {};
        role['roles.' + series._id] = ['01'];
        await mongoDb.updateOne(
            Collections.Users,
            { '_id': user._id },
            {
                $set: role
            }
        );

        console.log(`Inserted the meeting series "${series.project} - ${series.name}" with ${count} meeting minutes successfully`);

        await mongoDb.close();
    } catch (e) {
        if (!e.stack) console.error(e);
        else console.error(e.stack)
    }
}
main();