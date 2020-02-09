import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import { FlashMessage } from '../../helpers/flashMessage';
import { addCustomValidator } from '../../helpers/customFieldValidator'; 
import { emailAddressRegExpTest } from '/imports/helpers/email';
import {Session} from 'meteor/session';

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
            (new FlashMessage('Error', error.reason)).show();
        } else {
            (new FlashMessage('OK', 'Profile edited.', 'alert-success', 2000)).show();
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
                    'Confirm changing user mail',
                    'confirmPlainText',
                    { plainText: 'You are about to change your verified mail address. You will be signed out and need to verify your new mail address before you can continue.'},
                    'Sign off & Re-Verify'
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
        if (usr) {
            if (usr.profile){
                tmpl.find('#id_longName').value = usr.profile.name;
            } else {
                tmpl.find('#id_longName').value = '';
            }
            if (usr.emails[0] && usr.emails[0].address) {
                tmpl.find('#id_emailAddress').value = usr.emails[0].address;
            } else {
                tmpl.find('#id_emailAddress').value = '';
            }
        }
        tmpl.$('#btnEditProfileSave').prop('disabled',false);
    },

    'shown.bs.modal #dlgEditProfile': function (evt, tmpl) {
        tmpl.find('#id_longName').focus();
    }
});
