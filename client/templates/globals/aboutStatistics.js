import { Statistics } from "/imports/statistics";
import { Template } from "meteor/templating";

Template.aboutStatistics.onRendered(() => {
  new Statistics().update();
});

Template.aboutStatistics.helpers({
  statistics() {
    return Statistics.findOne();
  },
});
