import moment from "moment/moment";
import { Template } from "meteor/templating";

Template.githubcorner.helpers({
  isChristmasTime: function () {
    let now = moment();
    let start = moment();
    start.month(10);
    start.date(30);
    let end = moment();
    end.month(11);
    end.date(26);
    return now >= start && now <= end;
  },
});
