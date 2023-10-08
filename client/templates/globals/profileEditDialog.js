import {emailAddressRegExpTest} from "/imports/helpers/email";
import {Meteor} from "meteor/meteor";
import {Session} from "meteor/session";
import {Template} from "meteor/templating";
import {i18n} from "meteor/universe:i18n";
import isEmail from "validator/lib/isEmail";

import {
  ConfirmationDialogFactory
} from "../../helpers/confirmationDialogFactory";
import {addCustomValidator} from "../../helpers/customFieldValidator";
import {FlashMessage} from "../../helpers/flashMessage";

Template.profileEditDialog.onRendered(() => {
  addCustomValidator(
      "#id_emailAddress",
      (value) => { return isEmail(value); },
      "Not a valid E-Mail address",
  );
});

function updateUserProfile(tmpl) {
  const uLongName = tmpl.find("#id_longName").value;
  const uEmailAddress = tmpl.find("#id_emailAddress").value;

  tmpl.$("#btnEditProfileSave").prop("disabled", true);

  const editUserId = Session.get("editProfile.userID")
                         ? Session.get("editProfile.userID")
                         : Meteor.userId();
  Meteor.call(
      "users.editProfile",
      editUserId,
      uEmailAddress,
      uLongName,
      (error) => {
        if (error) {
          new FlashMessage(i18n.__("FlashMessages.error"), error.reason).show();
        } else {
          new FlashMessage(
              i18n.__("FlashMessages.ok"),
              i18n.__("FlashMessages.profileEditOK"),
              "alert-success",
              2000,
              )
              .show();
          tmpl.$("#dlgEditProfile").modal("hide");
        }
      },
  );

  tmpl.$("#btnEditProfileSave").prop("disabled", false);
}

Template.profileEditDialog.events({
  "submit #frmDlgEditProfile"(evt, tmpl) {
    evt.preventDefault();

    if (!Meteor.user()) {
      return;
    }

    if (Meteor.user().isDemoUser) {
      return;
    }

    const uEmailAddress = tmpl.find("#id_emailAddress").value;

    const userEditsOwnProfile = Session.get("editProfile.userID") === undefined;
    if (Meteor.settings.public.sendVerificationEmail && userEditsOwnProfile) {
      const changeUserMail = () => {
        updateUserProfile(tmpl);
        Meteor.logoutOtherClients();
        Meteor.logout();
      };

      if (Meteor.user().emails[0].address !== uEmailAddress) {
        ConfirmationDialogFactory
            .makeWarningDialogWithTemplate(
                changeUserMail,
                i18n.__("Profile.WarningEMailChange.title"),
                "confirmPlainText",
                {plainText : i18n.__("Profile.WarningEMailChange.body")},
                i18n.__("Profile.WarningEMailChange.button"),
                )
            .show();
      } else {
        updateUserProfile(tmpl);
      }
    } else {
      updateUserProfile(tmpl);
    }
  },

  "show.bs.modal #dlgEditProfile" : function(evt, tmpl) {
    const otherUserId = Session.get(
        "editProfile.userID"); // admin edit mode, undefined otherwise
    const usr = Meteor.users.findOne(
        otherUserId ? otherUserId : Meteor.userId(),
    );
    if (usr.profile) {
      tmpl.find("#id_longName").value = usr.profile.name;
    }
    tmpl.find("#id_emailAddress").value = usr.emails[0].address;
    tmpl.$("#btnEditProfileSave").prop("disabled", false);
  },

  "shown.bs.modal #dlgEditProfile" : function(
      evt, tmpl) { tmpl.find("#id_longName").focus(); },
});
