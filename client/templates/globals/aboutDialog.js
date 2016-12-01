Template.aboutDialog.onRendered(function() {
    Meteor.call('gitVersionInfo', function (error, result) {
        if (!error) {
            Session.set("gitVersionInfo", result);
        }
        else {
            console.log("err:"+error);
        }
    });
});

Template.aboutDialog.helpers({
    gitVersionInfo: function () {
        return Session.get("gitVersionInfo");
    }
});
