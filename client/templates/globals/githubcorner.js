import moment from "moment/moment";
import { Template } from "meteor/templating";

Template.githubcorner.helpers({
  isChristmasTime: function () {
    const now = moment();
    const start = moment();
    start.month(10);
    start.date(30);
    const end = moment();
    end.month(11);
    end.date(26);
    return now >= start && now <= end;
  },
});
