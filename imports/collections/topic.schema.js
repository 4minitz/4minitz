import { Meteor } from "meteor/meteor";
import { Class as SchemaClass } from "meteor/jagi:astronomy";
import { Mongo } from "meteor/mongo";

import "./idValidator";
import { InfoItemSchema } from "./infoitem.schema";

const TopicsCollection = new Mongo.Collection("topics");

export const TopicSchema = SchemaClass.create({
  name: "TopicSchema",
  collection: TopicsCollection,
  fields: {
    _id: { type: String, validators: [{ type: "meteorId" }] },
    parentId: {
      type: String,
      validators: [{ type: "meteorId" }],
      optional: true,
    },
    createdAt: { type: Date },
    createdBy: { type: String, optional: true },
    updatedAt: { type: Date },
    updatedBy: { type: String, optional: true },
    createdInMinute: { type: String, validators: [{ type: "meteorId" }] },
    subject: { type: String },
    responsibles: { type: [String], default: [], optional: true },
    isOpen: { type: Boolean, default: true },
    isRecurring: { type: Boolean, default: false },
    isNew: { type: Boolean, default: true },
    infoItems: { type: [InfoItemSchema], default: [] },
    labels: { type: [String], validators: [{ type: "meteorId" }] },
    isSkipped: { type: Boolean, default: false },
    sortOrder: { type: Number, optional: true, default: 0 },
    isEditedBy: { type: String, optional: true },
    isEditedDate: { type: Date, optional: true },
    // visibleFor: array of user IDs; optional since it is only necessary for topics living in the
    // topics collection. Topics inside a minutes do not have this field
    visibleFor: {
      type: [String],
      validators: [{ type: "meteorId" }],
      optional: true,
    },
  },
});

if (Meteor.isServer) {
  Meteor.publish("topics", function (meetingSeriesIdOrArray) {
    const parentIdSelector =
      typeof meetingSeriesIdOrArray === "string"
        ? { parentId: meetingSeriesIdOrArray } // we have an ID here
        : { parentId: { $in: meetingSeriesIdOrArray } }; //we have an whole array of ids here
    return TopicSchema.find({
      $and: [{ visibleFor: { $in: [this.userId] } }, parentIdSelector],
    });
  });

  Meteor.publish("topicOnlyOne", (topicID) =>
    TopicSchema.find({ _id: topicID }),
  );
}
