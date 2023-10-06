import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import { FlashMessage } from '../../helpers/flashMessage';
import { addCustomValidator } from '../../helpers/customFieldValidator';
import { emailAddressRegExpTest } from '/imports/helpers/email';
import {Session} from 'meteor/session';
import { i18n } from 'meteor/universe:i18n';

let checkEMailIsValid = (email) => {
    return emailAddressRegExpTest.test(email);
};

Template.profileEditDialog.onRendered(function() {
    addCustomValidator(
        '#id_emailAddress',
        (value) => { return checkEMailIsValid(value); },
        'Not a valid E-Mail address');
});

function updateUserProfile(tmpl) {
    let uLongName = tmpl.find('#id_longName').value;
    let uEmailAddress = tmpl.find('#id_emailAddress').value;

    tmpl.$('#btnEditProfileSave').prop('disabled',true);

    let editUserId = Session.get('editProfile.userID') ? Session.get('editProfile.userID') : Meteor.userId();
    Meteor.call('users.editProfile', editUserId, uEmailAddress, uLongName, function (error) {
        if (error) {
            (new FlashMessage(i18n.__('FlashMessages.error'), error.reason)).show();
        } else {
            (new FlashMessage(i18n.__('FlashMessages.ok'), i18n.__('FlashMessages.profileEditOK'), 'alert-success', 2000)).show();
            tmpl.$('#dlgEditProfile').modal('hide');
        }
    });

    tmpl.$('#btnEditProfileSave').prop('disabled',false);
}

Template.profileEditDialog.events({
    'submit #frmDlgEditProfile'(evt, tmpl) {
        evt.preventDefault();

        if (!Meteor.user()) {
            return;
        }

        if (Meteor.user().isDemoUser) {
            return;
        }

        let uEmailAddress = tmpl.find('#id_emailAddress').value;

        let userEditsOwnProfile = Session.get('editProfile.userID') === undefined;
        if (Meteor.settings.public.sendVerificationEmail && userEditsOwnProfile) {
            let changeUserMail = () => {
                updateUserProfile(tmpl);
                Meteor.logoutOtherClients();
                Meteor.logout();
            };

            if (Meteor.user().emails[0].address !== uEmailAddress) {
                ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                    changeUserMail,
                    i18n.__('Profile.WarningEMailChange.title'),
                    'confirmPlainText',
                    { plainText: i18n.__('Profile.WarningEMailChange.body')},
                    i18n.__('Profile.WarningEMailChange.button')
                ).show();
            }
            else {
                updateUserProfile(tmpl);
            }
        }
        else {
            updateUserProfile(tmpl);
        }
    },

    'show.bs.modal #dlgEditProfile': function (evt, tmpl) {
        let otherUserId = Session.get('editProfile.userID');    // admin edit mode, undefined otherwise
        let usr = Meteor.users.findOne(otherUserId ? otherUserId : Meteor.userId());
        if (usr.profile){
            tmpl.find('#id_longName').value = usr.profile.name;
        }
        tmpl.find('#id_emailAddress').value = usr.emails[0].address;
        tmpl.$('#btnEditProfileSave').prop('disabled',false);
    },

    'shown.bs.modal #dlgEditProfile': function (evt, tmpl) {
        tmpl.find('#id_longName').focus();
    }
});
