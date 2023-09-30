import "./collections/minutes_private";
import "./helpers/promisedMethods";
import "./collections/workflow_private";

import { emailAddressRegExpMatch } from "/imports/helpers/email";
import { subElementsHelper } from "/imports/helpers/subElements";
import { User } from "/imports/user";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { _ } from "meteor/underscore";
import { i18n } from "meteor/universe:i18n";

import { ActionItem } from "./actionitem";
import { MinutesSchema } from "./collections/minutes.schema";
import { MeetingSeries } from "./meetingseries";
import { Topic } from "./topic";

export class Minutes {
  constructor(source) {
    // constructs obj from Mongo ID or Mongo document
    if (!source)
      throw new Meteor.Error(
        "invalid-argument",
        "Mongo ID or Mongo document required",
      );

    if (typeof source === "string") {
      // we may have an ID here.
      source = Minutes.findOne(source);
    }
    if (typeof source === "object") {
      // inject class methods in plain collection document
      _.extend(this, source);
    }
  }

  // ################### static methods
  static find(...args) {
    return MinutesSchema.getCollection().find(...args);
  }

  static findOne(...args) {
    return MinutesSchema.getCollection().findOne(...args);
  }

  static findAllIn(MinutesIDArray, limit, lastMintuesFirst = true) {
    if (!MinutesIDArray || MinutesIDArray.length === 0) {
      return [];
    }

    let sort = lastMintuesFirst ? -1 : 1;
    let options = { sort: { date: sort } };
    if (limit) {
      options["limit"] = limit;
    }
    return Minutes.find({ _id: { $in: MinutesIDArray } }, options);
  }

  // method
  static remove(id) {
    return Meteor.callPromise("workflow.removeMinute", id);
  }

  // method
  static async syncVisibility(parentSeriesID, visibleForArray) {
    return Meteor.callPromise(
      "minutes.syncVisibilityAndParticipants",
      parentSeriesID,
      visibleForArray,
    );
  }

  static updateVisibleForAndParticipantsForAllMinutesOfMeetingSeries(
    parentSeriesID,
    visibleForArray,
  ) {
    if (MinutesSchema.find({ meetingSeries_id: parentSeriesID }).count() > 0) {
      MinutesSchema.update(
        { meetingSeries_id: parentSeriesID },
        { $set: { visibleFor: visibleForArray } },
        { multi: true },
      );

      // add missing participants to non-finalized meetings
      MinutesSchema.getCollection()
        .find({ meetingSeries_id: parentSeriesID })
        .forEach((min) => {
          if (!min.isFinalized) {
            let newparticipants = min.generateNewParticipants();
            if (newparticipants) {
              // Write participants to database if they have changed
              MinutesSchema.update(
                { _id: min._id },
                { $set: { participants: newparticipants } },
              );
            }
          }
        });
    }
  }

  // ################### object methods

  // method
  async update(docPart, callback) {
    console.log("Minutes.update()");
    const parentMeetingSeries = this.parentMeetingSeries();

    _.extend(docPart, { _id: this._id });
    await Meteor.callPromise("minutes.update", docPart, callback);

    // merge new doc fragment into this document
    _.extend(this, docPart);

    if (
      Object.prototype.hasOwnProperty.call(docPart, "date") ||
      Object.prototype.hasOwnProperty.call(docPart, "isFinalized")
    ) {
      return parentMeetingSeries.updateLastMinutesFieldsAsync(this);
    }
  }

  // method
  save(optimisticUICallback, serverCallback) {
    console.log("Minutes.save()");
    if (this.createdAt === undefined) {
      this.createdAt = new Date();
    }
    if (this._id && this._id !== "") {
      Meteor.call("minutes.update", this);
    } else {
      if (this.topics === undefined) {
        this.topics = [];
      }
      Meteor.call(
        "workflow.addMinutes",
        this,
        optimisticUICallback,
        serverCallback,
      );
    }
    this.parentMeetingSeries().updateLastMinutesFields(serverCallback);
  }

  toString() {
    return "Minutes: " + JSON.stringify(this, null, 4);
  }

  log() {
    console.log(this.toString());
  }

  parentMeetingSeries() {
    return new MeetingSeries(this.meetingSeries_id);
  }

  parentMeetingSeriesID() {
    return this.meetingSeries_id;
  }

  // This also does a minimal update of collection!
  // method
  async removeTopic(id) {
    let i = this._findTopicIndex(id);
    if (i !== undefined) {
      this.topics.splice(i, 1);
      return Meteor.callPromise("minutes.removeTopic", id);
    }
  }

  findTopic(id) {
    let i = this._findTopicIndex(id);
    if (i !== undefined) {
      return this.topics[i];
    }
    return undefined;
  }

  /**
   * Returns all topics which are created
   * within this meeting.
   */
  getNewTopics() {
    return this.topics.filter((topic) => {
      return topic.isNew;
    });
  }

  /**
   * Returns all old topics which were closed
   * within this topic.
   */
  getOldClosedTopics() {
    return this.topics.filter((topic) => {
      return !topic.isNew && !topic.isOpen && !Topic.hasOpenActionItem(topic);
    });
  }

  /**
   * Checks whether this minute has at least one
   * open AI.
   *
   * @returns {boolean}
   */
  hasOpenActionItems() {
    for (let i = this.topics.length; i-- > 0; ) {
      let topic = new Topic(this, this.topics[i]);
      if (topic.hasOpenActionItem()) {
        return true;
      }
    }
    return false;
  }

  getOpenTopicsWithoutItems() {
    return this.topics
      .filter((topicDoc) => {
        return topicDoc.isOpen;
      })
      .map((topicDoc) => {
        topicDoc.infoItems = [];
        return topicDoc;
      });
  }

  // method
  async upsertTopic(topicDoc, insertPlacementTop = true) {
    let i = undefined;

    if (!topicDoc._id) {
      // brand-new topic
      topicDoc._id = Random.id(); // create our own local _id here!
    } else {
      i = this._findTopicIndex(topicDoc._id); // try to find it
    }

    if (i === undefined) {
      // topic not in array
      return Meteor.callPromise(
        "minutes.addTopic",
        this._id,
        topicDoc,
        insertPlacementTop,
      );
    } else {
      this.topics[i] = topicDoc; // overwrite in place
      return Meteor.callPromise("minutes.updateTopic", topicDoc._id, topicDoc);
    }
  }

  /**
   *
   * @returns ActionItem[]
   */
  getOpenActionItems(includeSkippedTopics = true) {
    let nonSkippedTopics = includeSkippedTopics
      ? this.topics
      : this.topics.filter((topic) => !topic.isSkipped);

    return nonSkippedTopics.reduce(
      (acc, topicDoc) => {
        let topic = new Topic(this, topicDoc);
        let actionItemDocs = topic.getOpenActionItems();
        return acc.concat(
          actionItemDocs.map((doc) => {
            return new ActionItem(topic, doc);
          }),
        );
      },
      /* initial value */ [],
    );
  }

  // method
  sendAgenda() {
    return Meteor.callPromise("minutes.sendAgenda", this._id);
  }

  getAgendaSentAt() {
    if (!this.agendaSentAt) {
      return false;
    }
    return this.agendaSentAt;
  }

  isCurrentUserModerator() {
    return this.parentMeetingSeries().isCurrentUserModerator();
  }

  /**
   * Gets all persons who want to be
   * informed about this minute:
   * (visibleFor + informedUsers)
   *
   * @returns {string[]} of user ids
   */
  getPersonsInformed() {
    let informed = this.visibleFor;
    if (this.informedUsers) {
      informed = informed.concat(this.informedUsers);
    }
    return informed;
  }

  /**
   * Returns all informed persons with name and
   * email address.
   * Skips all persons with no email address.
   *
   * @param userCollection
   * @returns {Array}
   */
  getPersonsInformedWithEmail(userCollection) {
    let recipientResult = this.getPersonsInformed().reduce(
      (recipients, userId) => {
        let user = userCollection.findOne(userId);
        if (user.emails && user.emails.length > 0) {
          recipients.push({
            userId: userId,
            name: user.username,
            address: user.emails[0].address,
          });
        }
        return recipients;
      },
      /* initial value */ [],
    );

    // search for mail addresses in additional participants and add them to
    // recipients
    if (this.participantsAdditional) {
      let addMails = this.participantsAdditional.match(emailAddressRegExpMatch);
      if (addMails) {
        // addMails is null if there is no substring matching the email regular
        // expression
        addMails.forEach((additionalMail) => {
          recipientResult.push({
            userId: "additionalRecipient",
            name: additionalMail,
            address: additionalMail,
          });
        });
      }
    }

    return recipientResult;
  }

  // method?
  /**
   * Sync all users of .visibleFor into .participants
   * This method adds and removes users from the .participants list.
   * But it does not change attributes (e.g. .present) of untouched users
   * It will not write the new Participants into the database.
   * Instead it returns an array containing the new participants. If the
   * participants have not changed it will return "undefined" Throws an
   * exception if this minutes are finalized
   *
   * @returns {Array}
   */
  generateNewParticipants() {
    if (this.isFinalized) {
      throw new Error(
        "generateNewParticipants () must not be called on finalized minutes",
      );
    }
    let changed = false;

    let participantDict = {};
    if (this.participants) {
      this.participants.forEach((participant) => {
        participantDict[participant.userId] = participant;
      });
    }

    let newParticipants = this.visibleFor.map((userId) => {
      if (!participantDict[userId]) {
        // Participant has been added, insert with default values
        changed = true;
        return {
          userId: userId,
          present: false,
          minuteKeeper: false,
        };
      } else {
        // Participant stays without changes
        let participant = participantDict[userId];
        delete participantDict[userId];
        return participant;
      }
    });
    this.participants = newParticipants;

    // Now the participantsDict contains only the participants that have been
    // removed. If there are any the database has to be updated
    changed = changed || Object.keys(participantDict).length > 0;

    // only return new paricipants if they have changed
    return changed ? newParticipants : undefined;
  }

  // method?
  /**
   * Change presence of a single participant. Immediately updates .participants
   * array
   * TODO Reactive performance may be better if we only update one array element
   * in DB
   * @param userid of the participant in the participant array
   * @param isPresent new state of presence
   */
  async updateParticipantPresent(userid, isPresent) {
    let index = -1;
    if (this.participants) {
      for (let i = 0; i < this.participants.length; i++) {
        if (this.participants[i].userId === userid) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        this.participants[index].present = isPresent;
        return this.update({ participants: this.participants });
      }
    }
    return false;
  }

  /**
   * Returns the list of participants and adds the name of
   * each participants if a userCollection is given.
   * @param userCollection to query for the participants name.
   * @returns {Array}
   */
  getParticipants(userCollection) {
    if (userCollection) {
      return this.participants.map((participant) => {
        let user = userCollection.findOne(participant.userId);
        if (user) {
          participant.name = user.username;
          participant.profile = user.profile;
        } else {
          participant.name = "Unknown " + participant.userId;
        }
        return participant;
      });
    }

    return this.participants;
  }
  /**
   * Change presence of a all participants in a Minute
   * @param isPresent new state of presence
   */
  async changeParticipantsStatus(isPresent) {
    this.participants.forEach((p) => (p.present = isPresent));
    return this.update({ participants: this.participants });
  }

  /**
   * Returns the list of informed users and adds the name of
   * each informed if a userCollection is given.
   * @param userCollection to query for the participants name.
   * @returns {Array}
   */
  getInformed(userCollection) {
    if (this.informedUsers) {
      if (userCollection) {
        return this.informedUsers.map((informed) => {
          let user = userCollection.findOne(informed);
          informed = {
            id: informed,
            name: user ? user.username : "Unknown " + informed,
            profile: user ? user.profile : null,
          };
          return informed;
        });
      } else {
        return this.informedUsers;
      }
    }

    return [];
  }

  /**
   * Returns a human readable list of present participants of the meeting
   * @param maxChars truncate and add ellipsis if necessary
   * @returns {String} with comma separated list of names
   */
  getPresentParticipantNames(maxChars) {
    // todo: does this member have to be updated?
    this.participants = this.participants || [];
    const additionalParticipants = this.participantsAdditional || [];

    const presentParticipantIds = this.participants
      .filter((p) => p.present)
      .map((p) => p.userId);

    const presentParticipants = Meteor.users.find({
      _id: { $in: presentParticipantIds },
    });

    let names = presentParticipants
      .map((p) => {
        const user = new User(p);
        return user.profileNameWithFallback();
      })
      .concat(additionalParticipants)
      .join("; ");

    if (maxChars && names.length > maxChars) {
      return names.substr(0, maxChars) + "...";
    }

    return names || i18n.__("Minutes.Participants.none");
  }

  checkParent() {
    let parent = this.parentMeetingSeries();
    if (!parent.hasMinute(this._id)) {
      throw new Meteor.Error("runtime-error", "Minute is an orphan!");
    }
  }

  // ################### private methods
  _findTopicIndex(id) {
    return subElementsHelper.findIndexById(id, this.topics);
  }

  static formatResponsibles(responsible, usernameField, isProfileAvaliable) {
    if (isProfileAvaliable && responsible.profile && responsible.profile.name) {
      responsible.fullname =
        responsible[usernameField] + ` - ${responsible.profile.name}`;
    } else {
      responsible.fullname = responsible[usernameField];
    }
    return responsible;
  }
}
