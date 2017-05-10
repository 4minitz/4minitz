Template.versionInfo.helpers({
    gitVersionInfo: function () {
        return Session.get('gitVersionInfo');
    }
});

Template.versionInfo.events({
 //add your events here
});

Template.versionInfo.onCreated(function() {
    //add your statement here
});

Template.versionInfo.onRendered(function() {
    Meteor.call('gitVersionInfo', function (error, result) {
        if (!error) {
            Session.set('gitVersionInfo', result);
        }
        else {
            console.log('err:'+error);
        }
    });
});

Template.versionInfo.onDestroyed(function() {
    //add your statement here
});
