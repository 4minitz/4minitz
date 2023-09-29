import { expect } from "chai";
import _ from "underscore";
const { faker } = require("@faker-js/faker");

import { ParticipantsPreparer } from "../../../../imports/client/ParticipantsPreparer";

let generateId = () => {
  return faker.string.uuid();
};

let createUser = (id, username, name) => {
  return { _id: id, username: username, profile: { name: name } };
};

const USER_1 = createUser(generateId(), "user1", "First User");
const USER_2 = createUser(generateId(), "user2", "Second User");
const USER_3 = createUser(generateId(), "user3", "Third User");

describe("ParticipantsPreparer", function () {
  let preparer,
    fakeMinutes,
    fakeParentSeries,
    fakeTopicOrItem,
    fakeUserCollection;

  beforeEach(function () {
    fakeMinutes = {
      participants: [],
      participantsAdditional: "",
      parentMeetingSeries: () => {
        return fakeParentSeries;
      },
    };
    fakeParentSeries = { additionalResponsibles: [] };
    fakeTopicOrItem = {
      _topicDoc: { responsibles: [] },
      hasResponsibles: function () {
        return this._topicDoc.responsibles.length > 0;
      },
      getResponsibles: function () {
        return this._topicDoc.responsibles;
      },
    };
    fakeUserCollection = {
      users: [USER_1, USER_2, USER_3],
      find: function (selector) {
        let excludeIds = selector.$and[0]._id.$nin;
        let result = this.users.filter((user) => {
          return !_.contains(excludeIds, user._id);
        });
        return {
          fetch: () => {
            return result;
          },
        };
      },
      findOne: function (id) {
        for (let i = 0; i < this.users.length; i++) {
          if (this.users[i]._id === id) {
            return this.users[i];
          }
        }
        return false;
      },
    };

    preparer = new ParticipantsPreparer(
      fakeMinutes,
      fakeTopicOrItem,
      fakeUserCollection,
    );
    preparer._init();
  });

  describe("#getPossibleResponsibles", function () {
    const ADDITIONAL_RESP_TEXT = "guest";
    const ADDITIONAL_RESP_MAIL = "guest@mail.de";
    const FORMER_RESP_TEXT = "old guest";
    const FORMER_RESP_MAIL = "old_guest@mail.de";

    beforeEach(function () {
      fakeMinutes.participants = [
        { userId: USER_2._id },
        { userId: USER_1._id },
      ];
    });

    it("returns all participants of the current minutes", function () {
      preparer._prepareResponsibles();
      let result = preparer.getPossibleResponsibles();
      expect(result).to.have.length(2);
      expect(result).to.deep.include({
        id: USER_1._id,
        text: `${USER_1.username} - ${USER_1.profile.name}`,
      });
      expect(result).to.deep.include({
        id: USER_2._id,
        text: `${USER_2.username} - ${USER_2.profile.name}`,
      });
    });

    it("returns the additional responsible, too", function () {
      fakeMinutes.participantsAdditional = `${ADDITIONAL_RESP_TEXT}, ${ADDITIONAL_RESP_MAIL}`;
      preparer._prepareResponsibles();
      let result = preparer.getPossibleResponsibles();
      expect(result).to.have.length(4);
      expect(result).to.deep.include({
        id: ADDITIONAL_RESP_TEXT,
        text: ADDITIONAL_RESP_TEXT,
      });
      expect(result).to.deep.include({
        id: ADDITIONAL_RESP_MAIL,
        text: ADDITIONAL_RESP_MAIL,
      });
    });

    it("returns the former responsible, too", function () {
      fakeParentSeries.additionalResponsibles = [
        FORMER_RESP_TEXT,
        FORMER_RESP_MAIL,
      ];
      preparer._prepareResponsibles();
      let result = preparer.getPossibleResponsibles();
      expect(result).to.have.length(4);
      expect(result).to.deep.include({
        id: FORMER_RESP_TEXT,
        text: FORMER_RESP_TEXT,
      });
      expect(result).to.deep.include({
        id: FORMER_RESP_MAIL,
        text: FORMER_RESP_MAIL,
      });
    });

    it("returns only valid entries from the former/additional responsible if desired", function () {
      fakeMinutes.participantsAdditional = `${ADDITIONAL_RESP_TEXT}, ${ADDITIONAL_RESP_MAIL}`;
      fakeParentSeries.additionalResponsibles = [
        FORMER_RESP_TEXT,
        FORMER_RESP_MAIL,
      ];
      preparer.freeTextValidator = (text) => {
        return text.indexOf("@") !== -1;
      };
      preparer._prepareResponsibles();
      let result = preparer.getPossibleResponsibles();
      expect(result).to.have.length(4);
      expect(result).to.deep.include({
        id: ADDITIONAL_RESP_MAIL,
        text: ADDITIONAL_RESP_MAIL,
      });
      expect(result).to.deep.include({
        id: FORMER_RESP_MAIL,
        text: FORMER_RESP_MAIL,
      });
    });

    it("returns also the responsible of the current topic/item", function () {
      fakeTopicOrItem._topicDoc.responsibles = [
        { id: "free-text-entry", text: "free-text-entry" },
        { id: USER_2._id, text: USER_2.name },
      ];
      preparer._prepareResponsibles();
      let result = preparer.getPossibleResponsibles();
      expect(result).to.have.length(3);
    });
  });
});
