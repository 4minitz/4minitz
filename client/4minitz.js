import { Meteor } from 'meteor/meteor'

Meteor.startup(function () {
    $.material.init();
});

Meteor.call("gitVersionInfoUpdate");
