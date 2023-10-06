import { Statistics } from '/imports/statistics';
import { Template } from 'meteor/templating';

Template.aboutStatistics.onRendered(function () {
    (new Statistics()).update();
});

Template.aboutStatistics.helpers({
    statistics() {
        return Statistics.findOne();
    }
});
