import { MeetingSeriesGenerator } from "../generators/meeting-series-generator";
import { MinutesGenerator } from "../generators/minutes-generator";
import { TopicsGenerator } from "../generators/topics-generator";

const expect = require("chai").expect;

describe("Generate Data", () => {
  it("should not fail", () => {
    const user = { _id: "userId", username: "username" };
    const meetingSeriesGenerator = new MeetingSeriesGenerator(user);
    const series = meetingSeriesGenerator.generate();
    const minutesGenerator = new MinutesGenerator(
      { minutesCount: 5 },
      series._id,
      user,
    );
    const topicsGenerator = new TopicsGenerator({
      topicsRange: { min: 3, max: 10 },
      itemsRange: { min: 1, max: 8 },
      detailsSentenceRange: { min: 7, max: 23 },
    });
    const minutes = minutesGenerator.generate(topicsGenerator);
    meetingSeriesGenerator.addAllMinutes(
      minutes,
      topicsGenerator.seriesTopicList,
    );
  });
});
