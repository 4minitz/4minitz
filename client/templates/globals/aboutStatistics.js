import { Statistics } from '/imports/statistics';

Template.aboutStatistics.onRendered(function () {
    (new Statistics()).update();
});

Template.aboutStatistics.helpers({
    statistics() {
        return Statistics.findOne();
    }
});