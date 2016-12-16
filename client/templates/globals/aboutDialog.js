let showStatistics = new ReactiveVar(false); 

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
    },
    displayStatistics: function() {
        return showStatistics.get();
    }
});

Template.aboutDialog.events({
    "click #about-4minitz-logo" : function(){
        showStatistics.set(true);
    }
});
