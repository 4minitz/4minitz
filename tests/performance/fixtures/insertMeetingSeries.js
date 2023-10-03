import { MeetingSeriesGenerator } from "./generators/meeting-series-generator";
import { MinutesGenerator } from "./generators/minutes-generator";
import { TopicsGenerator } from "./generators/topics-generator";
import { Collections, MongoDb } from "./lib/mongo-db";
import { RangeHelper } from "./lib/range-helper";

/* Define parameters */
let optionParser = require("node-getopt").create([
  [
    "m",
    "mongourl=[ARG]",
    "Mongo DB url (default: mongodb://localhost:3101/meteor)",
  ],
  [
    "u",
    "username=[ARG]",
    "The username of the user who should be the owner of the created minutes (default: user1)",
  ],
  ["", "minutes-count=[ARG]", "The number of minutes which should be created"],
  [
    "",
    "topics-range=[ARG]",
    "The range of topics each minutes should contain (e.g. 3-10)",
  ],
  [
    "",
    "items-range=[ARG]",
    "The range of items each topic should contain (e.g. 1-8)",
  ],
  [
    "",
    "details-range=[ARG]",
    "The range of sentences each detail should contain (e.g. 7-23)",
  ],
  ["h", "help", "Display this help"],
]);

/* Initialize parameter parser */
let arg = optionParser.bindHelp().parseSystem();

const USERNAME = arg.options.username || "user1";
const MONGO_URL = arg.options.mongourl || "mongodb://localhost:3101/meteor";
const CONFIG = {
  minutesCount: parseInt(arg.options["minutes-count"], 10) || 5,
  topicsRange: RangeHelper.convertRangeToMinMaxObject(
    arg.options["topics-range"],
    { min: 3, max: 10 },
  ),
  itemsRange: RangeHelper.convertRangeToMinMaxObject(
    arg.options["items-range"],
    { min: 1, max: 8 },
  ),
  detailsSentenceRange: RangeHelper.convertRangeToMinMaxObject(
    arg.options["details-range"],
    { min: 7, max: 23 },
  ), // number of sentences per detail
  username: USERNAME,
};

async function main() {
  try {
    // set up the database
    let mongoDb = new MongoDb(MONGO_URL);
    await mongoDb.connect();

    // Find user id
    let user = await mongoDb.findOne("users", { username: USERNAME });

    // Generate the data
    let meetingSeriesGenerator = new MeetingSeriesGenerator(user);
    let series = meetingSeriesGenerator.generate();
    let minutesGenerator = new MinutesGenerator(CONFIG, series._id, user);
    let topicsGenerator = new TopicsGenerator(CONFIG);
    let minutes = minutesGenerator.generate(topicsGenerator);
    meetingSeriesGenerator.addAllMinutes(
      minutes,
      topicsGenerator.seriesTopicList,
    );

    await mongoDb.insertOne(Collections.MeetingSeries, series);
    await mongoDb.insertMany(
      Collections.Topcis,
      topicsGenerator.seriesTopicList.map((topic) => {
        topic.parentId = series._id;
        return topic;
      }),
    );
    let count = (await mongoDb.insertMany(Collections.Minutes, minutes))
      .insertedCount;

    // Add Role Moderator for User
    let role = {};
    role["roles." + series._id] = ["01"];
    await mongoDb.updateOne(
      Collections.Users,
      { _id: user._id },
      {
        $set: role,
      },
    );

    console.log(
      `Inserted the meeting series "${series.project} - ${series.name}" with ${count} meeting minutes successfully`,
    );

    await mongoDb.close();
  } catch (e) {
    if (!e.stack) console.error(e);
    else console.error(e.stack);
  }
}
main();
