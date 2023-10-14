const { faker } = require("@faker-js/faker");

export class gMSV {
  static generateMeetingSeriesValues() {
    return {
      project: faker.company.name(),
      name: faker.person.fullName(),
    };
  }
}
