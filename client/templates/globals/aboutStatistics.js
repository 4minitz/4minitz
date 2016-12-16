import { Statistics } from '/imports/statistics';

Template.aboutStatistics.onRendered(function () {
    Statistics.update();
});

Template.aboutStatistics.helpers({
    statistics() {
        return Statistics.fetch();
    }
});