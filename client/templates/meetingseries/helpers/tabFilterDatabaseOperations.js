import { Meteor } from "meteor/meteor";
import { Label } from "/imports/label";

module.exports = {
  createLabelIdsReceiver: function (parentMeetingSeriesId) {
    return function getLabelIdsByName(labelName, caseSensitive) {
      const label = Label.findLabelsContainingSubstring(
        parentMeetingSeriesId,
        labelName,
        caseSensitive
      );
      if (label !== null) {
        return label.map((label) => {
          return label._id;
        });
      }
      return null;
    };
  },

  createUserIdsReceiver: function getUserIdsByName(userName) {
    const users =
      userName === "me"
        ? [Meteor.user()]
        : Meteor.users.find({ username: { $regex: userName } }).fetch();
    if (users) {
      return users.map((user) => {
        return user._id;
      });
    }

    return [];
  },
};
