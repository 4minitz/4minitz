
import { Meteor } from 'meteor/meteor';

import { GlobalSettings } from '/imports/config/GlobalSettings'
import { FlashMessage } from '../../helpers/flashMessage';
import { handleError } from '../../helpers/handleError';


Template.adminRegisterUser.helpers({
    isMailEnabled() {
        return GlobalSettings.isEMailDeliveryEnabled();
    }
});

Template.adminRegisterUser.events({
    "submit #frmDlgRegisterUser"(evt) {
        evt.preventDefault();
    },

    "click #btnRegisterUserSave"(evt, tmpl) {
        if (! Meteor.user().isAdmin) {
            return;
        }

        let uName = tmpl.find("#id_newUsrName").value;
        let uLongName = tmpl.find("#id_newUsrLongName").value;
        let uMail = tmpl.find("#id_newUsrMail").value;
        let uPassword1 = tmpl.find("#id_newUsrPassword1").value;
        let uPassword2 = tmpl.find("#id_newUsrPassword2").value;

        let sendMail = false;
        let sendPassword = false;
        if (tmpl.find("#id_regUserSendMail")) {
            sendMail = tmpl.find("#id_regUserSendMail").checked;
            sendPassword = tmpl.find("#id_RegUserSendPassword").checked;
        }

        tmpl.$("#btnRegisterUserSave").prop("disabled",true);
        Meteor.call("users.admin.registerUser",
                    uName, uLongName, uMail, uPassword1, uPassword2, sendMail, sendPassword,
                    function (error) {
                        if (error) {
                            tmpl.$("#btnRegisterUserSave").prop("disabled",false);
                            console.log(error);
                            evt.preventDefault();
                            handleError(error);
                        } else {
                            (new FlashMessage('OK', "Registered new user: "+uName, 'alert-success', 3000)).show();
                            Meteor.setTimeout(function () {
                                $('#dlgAdminRegisterUser').modal("hide");
                            }, 3000);
                        }
                    });
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
