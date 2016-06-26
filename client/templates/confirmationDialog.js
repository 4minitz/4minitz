Session.setDefault("confirmationDialogTitle", "Confirm delete");
Session.setDefault("confirmationDialogContent", "Are you sure to delete this?");


Template.confirmationDialog.onRendered(function () {
    // $.material.init();
});


Template.confirmationDialog.helpers({
    'getTitle': function() {
        return Session.get("confirmationDialogTitle");
    },

    'getContent': function() {
        // SafeString allows us to pass html content
        let content = Spacebars.SafeString(Session.get("confirmationDialogContent"));
        // We need this forked to re-create material checkboxes
        Meteor.setTimeout(function () {
            // $.material.init();
        }, 0);
        return content;
    },
    'getConfirmBtnName': function() {
        return Session.get("confirmationDialogConfirmButton");
    }
});
