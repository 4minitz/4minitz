Session.setDefault("confirmationDialogTitle", "Confirm delete");
Session.setDefault("confirmationDialogContent", "Are you sure to delete this?");
Session.setDefault("confirmationDialogConfirmButton", "Delete");

Template.confirmationDialog.helpers({
    'getTitle': function() {
        return Session.get("confirmationDialogTitle");
    },

    'getContent': function() {
        return Session.get("confirmationDialogContent");
    },
    'getConfirmBtnName': function() {
        return Session.get("confirmationDialogConfirmButton");
    }
});