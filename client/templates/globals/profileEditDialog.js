import { FlashMessage } from '../../helpers/flashMessage';
import { Meteor } from 'meteor/meteor';

let showError = function (evt, error) {
    (new FlashMessage('Error', error.reason)).show();
    evt.preventDefault();
};


Template.profileEditDialog.events({
    "submit #frmDlgEditProfile"(evt, tmpl) {
        evt.preventDefault();
    },

    "click #btnEditProfileSave"(evt, tmpl) {
        if (!Meteor.user()) {
            return;
        }
        Session.set('errorTitle', null);
        Session.set('errorReason', null);

        let uLongName = tmpl.find("#id_longName").value;
        let uEmailAddress = tmpl.find("#id_emailAddress").value;


        if (! global.emailAddressRegExpTest.test(uEmailAddress)) {
            showError(evt, {reason: "Not a valid E-Mail address"});
            return;
        }

        tmpl.$("#btnEditProfileSave").prop("disabled",false);
        Meteor.call('users.saveSettings',{
            settings: {email: uEmailAddress, profile: {name: uLongName}},
          });

    },

    "hidden.bs.modal #dlgEditProfile": function () {
        Session.set('errorTitle', null);
        Session.set('errorReason', null);
    },

    "show.bs.modal #dlgEditProfile": function (evt, tmpl) {
        let usr = Meteor.users.findOne(Meteor.userId());
        tmpl.find("#id_longName").value = usr.profile.name;
        tmpl.find("#id_emailAddress").value = usr.emails[0].address;
    },

    "shown.bs.modal #dlgEditProfile": function (evt, tmpl) {
        tmpl.find("#id_longName").focus();
    }


});
