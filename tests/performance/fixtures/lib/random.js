var randomstring = require("randomstring");
const { faker } = require("@faker-js/faker");

export class Random {
  static generateId() {
    // unique id from the random package also used by minimongo
    // character list:
    // https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L88
    // string length:
    // https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L197
    return randomstring.generate({
      length: 17,
      readable: true,
      charset: "alphanumeric",
    });
  }

  static randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static generateMeetingSeriesValues() {
    return {
      project: faker.company.name(),
      name: faker.person.fullName(),
    };
  }
}
