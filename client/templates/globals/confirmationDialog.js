Session.setDefault("confirmationDialogTitle", "Confirm delete");
Session.setDefault("confirmationDialogContent", "Are you sure to delete this?");


Template.confirmationDialog.helpers({
    'getTitle': function() {
        return Session.get("confirmationDialogTitle");
    },

    'getContent': function() {
        // SafeString allows us to pass html content
        return Spacebars.SafeString(Session.get("confirmationDialogContent"));
    },
    'getConfirmBtnName': function() {
        return Session.get("confirmationDialogConfirmButton");
    }
});
