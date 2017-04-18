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

        tmpl.$("#btnEditProfileSave").prop("disabled",true);

        Meteor.call('users.editProfile', uEmailAddress,uLongName, function (error, result) {
            if (error) {
                tmpl.$("#btnEditProfileSave").prop("disabled",false);
                console.log(error);
                showError(evt, error);
            } else {
                (new FlashMessage('OK', "Profile edited.", 'alert-success', 2000)).show();
                Meteor.setTimeout(function () {
                    $('#dlgEditProfile').modal("hide");
                }, 2000);
            }
        });

    },

    "hidden.bs.modal #dlgEditProfile": function () {
        Session.set('errorTitle', null);
        Session.set('errorReason', null);
    },

    "show.bs.modal #dlgEditProfile": function (evt, tmpl) {
        let usr = Meteor.users.findOne(Meteor.userId());
        if (usr.profile){
            tmpl.find("#id_longName").value = usr.profile.name;
        }
        tmpl.find("#id_emailAddress").value = usr.emails[0].address;
        tmpl.$("#btnEditProfileSave").prop("disabled",false);
    },

    "shown.bs.modal #dlgEditProfile": function (evt, tmpl) {
        tmpl.find("#id_longName").focus();
    }


});
