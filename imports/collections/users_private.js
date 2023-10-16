import { checkWithMsg } from "/imports/helpers/check";
import { AdminRegisterUserMailHandler } from "/imports/mail/AdminRegisterUserMailHandler";
import { Accounts } from "meteor/accounts-base";
import { check, Match } from "meteor/check";
import { Meteor } from "meteor/meteor";
import isEmail from "validator/lib/isEmail";

Meteor.methods({
  "users.saveSettings"(settings) {
    const id = Meteor.userId();
    Meteor.users.update(id, { $set: { settings } });
    console.log(`saved settings for user ${id}: ${settings}`);
  },

  "users.editProfile"(userId, eMail, longName) {
    check(eMail, String);
    check(longName, String);
    if (!Meteor.userId()) {
      throw new Meteor.Error("Cannot edit profile", "User not logged in.");
    }

    if (!Meteor.user().isAdmin && Meteor.userId() !== userId) {
      throw new Meteor.Error(
        "Cannot edit profile",
        "You are not admin or you are trying to change someone else's profile",
      );
    }

    if (!isEmail(eMail)) {
      throw new Meteor.Error("Invalid E-Mail", "Not a valid E-Mail address");
    }

    const targetUser = Meteor.users.findOne({ _id: userId });
    if (!targetUser) {
      throw new Meteor.Error(
        "Could not find user",
        `No user found for ID: ${userId}`,
      );
    }

    if (targetUser.isLDAPuser) {
      throw new Meteor.Error(
        "LDAP-Users cannot change profile",
        "LDAP-Users may not change their longname or their E-Mail-address",
      );
    }
    const hasMailChanged = eMail !== targetUser.emails[0].address;

    if (hasMailChanged) {
      const ifEmailExists = Meteor.users.findOne({ "emails.0.address": eMail });
      if (ifEmailExists !== undefined) {
        throw new Meteor.Error(
          "Invalid E-Mail",
          "E-Mail address already in use",
        );
      }
    }

    Meteor.users.update(userId, {
      $set: { "emails.0.address": eMail, "profile.name": longName },
    });

    if (hasMailChanged) {
      if (Meteor.user().isAdmin) {
        Meteor.users.update(userId, { $set: { "emails.0.verified": true } });
      } else {
        Meteor.users.update(userId, { $set: { "emails.0.verified": false } });
        if (Meteor.isServer && Meteor.settings.public.sendVerificationEmail) {
          Accounts.sendVerificationEmail(userId);
        }
      }
    }
  },

  "users.admin.changePassword"(userId, password1, password2) {
    if (!Meteor.isServer) {
      return;
    }
    // #Security: Only logged in admin may invoke this method:
    // users.admin.changePassword
    console.log(`users.admin.changePassword for user: ${Meteor.userId()}`);
    if (!Meteor.userId()) {
      throw new Meteor.Error("Cannot change password", "User not logged in.");
    }
    if (!Meteor.user().isAdmin) {
      throw new Meteor.Error("Cannot change password", "You are not admin.");
    }

    check(userId, String);
    check(password1, String);
    check(password2, String);
    if (password1 !== password2) {
      throw new Meteor.Error(
        "Cannot change password",
        "Passwords do not match",
      );
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password1)) {
      throw new Meteor.Error(
        "Cannot change password",
        "Password: min. 6 chars (at least 1 digit, 1 lowercase and 1 uppercase)",
      );
    }

    Accounts.setPassword(userId, password1, { logout: false });
  },

  "users.admin.registerUser"(
    username,
    longname,
    email,
    password1,
    password2,
    sendMail,
    sendPassword,
  ) {
    console.log(`users.admin.registerUser for user: ${username}`);
    // #Security: Only logged in admin may invoke this method:
    // users.admin.registerUser
    if (!Meteor.userId()) {
      throw new Meteor.Error("Cannot register user", "User not logged in.");
    }
    if (!Meteor.user().isAdmin) {
      throw new Meteor.Error("Cannot register user", "You are not admin.");
    }

    checkWithMsg(
      username,
      Match.Where((x) => {
        check(x, String);
        return x.length > 2;
      }),
      "Username: at least 3 characters",
    );
    check(password1, String);
    check(password2, String);
    check(sendMail, Boolean);
    check(sendPassword, Boolean);
    if (password1 !== password2) {
      throw new Meteor.Error("Cannot register user", "Passwords do not match");
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password1)) {
      throw new Meteor.Error(
        "Cannot register user",
        "Password: min. 6 chars (at least 1 digit, 1 lowercase and 1 uppercase)",
      );
    }
    checkWithMsg(
      email,
      Match.Where((x) => {
        check(x, String);
        return isEmail(x);
      }),
      "EMail address not valid",
    );

    const newUserId = Accounts.createUser({
      username,
      password: password1,
      email,
      profile: { name: longname },
    });

    Meteor.users.update({ username }, { $set: { "emails.0.verified": true } });

    if (Meteor.isServer && newUserId && sendMail) {
      const mailer = new AdminRegisterUserMailHandler(
        newUserId,
        sendPassword,
        password1,
      );
      mailer.send();
    }
  },

  "users.admin.ToggleInactiveUser"(userId) {
    console.log(`users.admin.ToggleInactiveUser for ${userId}`);
    // #Security: Only logged in admin may invoke this method:
    // users.admin.ToggleInactiveUser
    if (!Meteor.user().isAdmin) {
      throw new Meteor.Error(
        "Cannot toggle inactive user",
        "You are not admin.",
      );
    }
    const usr = Meteor.users.findOne(userId);
    if (usr) {
      if (usr.isInactive) {
        Meteor.users.update({ _id: userId }, { $unset: { isInactive: "" } });
      } else {
        Meteor.users.update({ _id: userId }, { $set: { isInactive: true } });
        // Logout user
        Meteor.users.update(
          { _id: userId },
          { $set: { "services.resume.loginTokens": [] } },
        );
      }
    } else {
      console.error(`Could not find user:${userId} to toggle isInactive`);
    }
  },
});
