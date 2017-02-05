
import { FlashMessage } from '../../helpers/flashMessage';


let showError = function (evt, error) {
    (new FlashMessage('Error', error.reason)).show();
    evt.preventDefault();
};

Template.adminRegisterUser.helpers({
 //add you helpers here
});

Template.adminRegisterUser.events({
    "submit #frmDlgRegisterUser"(evt, tmpl) {
        evt.preventDefault();
    },

    "click #btnRegisterUserSave"(evt, tmpl) {
        if (! Session.get("users.isAdmin")) {
            return;
        }
        Session.set('errorTitle', null);
        Session.set('errorReason', null);


        let uName = tmpl.find("#id_newUsrName").value;
        let uLongName = tmpl.find("#id_newUsrLongName").value;
        let uMail = tmpl.find("#id_newUsrMail").value;
        let uPassword1 = tmpl.find("#id_newUsrPassword1").value;
        let uPassword2 = tmpl.find("#id_newUsrPassword2").value;

        // TODO: sanitize all input!!

        if (uName.length < 3) {
            showError(evt, {reason: "Username: at least 3 characters"});
            return;
        }
        if (uPassword1 != uPassword2) {
            showError(evt, {reason: "Passwords do not match"});
            return;
        }
        if (! global.emailAddressRegExpTest.test(uMail)) {
            showError(evt, {reason: "EMail address not valid"});
            return;
        }
        if (! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(uPassword1)) {
            showError(evt, {reason: "Password: At least 1 digit, 1 lowercase and 1 uppercase"});
            return;
        }

        tmpl.$("#btnRegisterUserSave").prop("disabled",true);
        Meteor.call("users.registerUser", uName, uLongName, uMail, uPassword1, function (error, result) {
            if (error) {
                tmpl.$("#btnRegisterUserSave").prop("disabled",false);
                console.log(error);
                showError(evt, error);
            } else {
                (new FlashMessage('OK', "Registered new user: "+uName, 'alert-success', 3000)).show();
                Meteor.setTimeout(function () {
                    $('#dlgAdminRegisterUser').modal("hide");
                }, 3000);
            }
        });
    },

    "hidden.bs.modal #dlgAdminRegisterUser": function () {
        Session.set('errorTitle', null);
        Session.set('errorReason', null);
    },

    "show.bs.modal #dlgAdminRegisterUser": function (evt, tmpl) {
        tmpl.find("#id_newUsrName").value = "";
        tmpl.find("#id_newUsrLongName").value = "";
        tmpl.find("#id_newUsrMail").value = "";
        tmpl.find("#id_newUsrPassword1").value = "";
        tmpl.find("#id_newUsrPassword2").value = "";
        tmpl.$("#btnRegisterUserSave").prop("disabled",false);
    },

    "shown.bs.modal #dlgAdminRegisterUser": function (evt, tmpl) {
        tmpl.find("#id_newUsrName").focus();
    }

});

Template.adminRegisterUser.onCreated(function() {
    //add your statement here
});

Template.adminRegisterUser.onRendered(function() {
    //add your statement here
});

Template.adminRegisterUser.onDestroyed(function() {
    //add your statement here
});
