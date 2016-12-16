import { Meteor } from 'meteor/meteor';

let statisticSource = new ReactiveVar({});

Template.aboutStatistics.onRendered(function () {
    Meteor.call("server.statistics", function (error, stats) {
        statisticSource.set(stats);
    });
});

Template.aboutStatistics.helpers({
    statistics() {
        return statisticSource.get();
    }
});