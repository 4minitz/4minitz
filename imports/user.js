import { Meteor } from "meteor/meteor";

export class User {
  constructor(source) {
    if (!source) {
      // Case 1: currently logged in user
      this.user = Meteor.user();
      this.id = this.user._id;
    } else if (typeof source === "string") {
      // Case 2: we assume we have a user ID here.
      this.id = source;
      this.user = Meteor.users.findOne(source);
    }
    if (typeof source === "object") {
      // Case 3: make deep copy of user object
      this.user = JSON.parse(JSON.stringify(source));
      this.id = this.user._id;
    }

    this.OK = Boolean(this.user);
  }

  static PROFILENAMEWITHFALLBACK(userObject) {
    if (userObject) {
      if (userObject.profile?.name) {
        return userObject.profile.name;
      } else {
        return userObject.username;
      }
    } else {
      return "Unknown (" + userObject._id ? userObject._id : userObject + ")";
    }
  }

  profileNameWithFallback() {
    return User.PROFILENAMEWITHFALLBACK(this.user);
  }

  userNameWithFallback() {
    if (this.user) {
      return this.user.username;
    } else {
      return "Unknown (" + this.id + ")";
    }
  }

  storeSetting(key, value) {
    if (this.user.settings === undefined) {
      this.user.settings = {};
    }
    this.user.settings[key] = value;

    Meteor.call("users.saveSettings", this.user.settings);
  }

  getSetting(key, defaultValue) {
    if (this.user.settings === undefined) {
      return defaultValue;
    }
    const value = this.user.settings[key];
    if (value === undefined) {
      return defaultValue;
    }
    return value;
  }
}

export const userSettings = {
  showQuickHelp: {
    meetingSeriesList: "showQuickHelp_meetingSeriesList",
    meetingSeries: "showQuickHelp_meetingSeries",
    meeting: "showQuickHelp_meeting",
    meetingUpload: "showQuickHelp_meetingUpload",
  },

  showAddDetail: "showAddDetail",
};
