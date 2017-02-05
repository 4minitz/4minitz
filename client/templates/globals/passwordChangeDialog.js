import { FlashMessage } from '../../helpers/flashMessage';

let showError = function (evt, error) {
    (new FlashMessage('Error', error.reason)).show();
    evt.preventDefault();
};


Template.passwordChangeDialog.events({
    "submit #frmDlgChangePassword"(evt, tmpl) {
        evt.preventDefault();
    },

    "click #btnChangePasswordSave"(evt, tmpl) {
        if (!Meteor.user()) {
            return;
        }
        Session.set('errorTitle', null);
        Session.set('errorReason', null);

        let uPassword1 = tmpl.find("#id_newPassword1").value;
        let uPassword2 = tmpl.find("#id_newPassword2").value;

        tmpl.$("#btnChangePasswordSave").prop("disabled",true);
        Meteor.call("users.changePassword", uPassword1, uPassword2,
            function (error, result) {
                if (error) {
                    tmpl.$("#btnChangePasswordSave").prop("disabled",false);
                    console.log(error);
                    showError(evt, error);
                } else {
                    (new FlashMessage('OK', "Password changed.", 'alert-success', 2000)).show();
                    tmpl.find("#id_newPassword1").value = "";
                    tmpl.find("#id_newPassword2").value = "";
                    Meteor.setTimeout(function () {
                        $('#dlgChangePassword').modal("hide");
                    }, 2000);
                }
            });
    },

    "hidden.bs.modal #dlgChangePassword": function () {
        Session.set('errorTitle', null);
        Session.set('errorReason', null);
    },

    "show.bs.modal #dlgChangePassword": function (evt, tmpl) {
        tmpl.find("#id_newPassword1").value = "";
        tmpl.find("#id_newPassword2").value = "";
        tmpl.$("#btnChangePasswordSave").prop("disabled",false);
    },

    "shown.bs.modal #dlgChangePassword": function (evt, tmpl) {
        tmpl.find("#id_newPassword1").focus();
    }
});
