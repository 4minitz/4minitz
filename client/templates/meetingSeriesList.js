Template.meetingSeriesList.onRendered(function () {
});


Template.meetingSeriesList.onCreated(function () {
});

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {createdAt: -1}});
    }
});

Template.meetingSeriesList.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click #deleteMeetingSeries": function() {
        console.log("Delete");
        if (confirm("Do you really want to delete this meeting series?")) {
          Meteor.call("deleteMeetingSeries", this._id);
        }
    },
    "click #deleteMeetingDB": function() {
        console.log("Delete from DB");
          Meteor.call("deleteMeetingSeries", this._id);
    }
});


Template.meetingSeriesOverview.helpers( {
    countMinutes: function() {
      if (this.minutes) {
        return this.minutes.length;
      } else {
        return 0;
      }
    },

    lastMinutes: function () {
        if (this.minutes && this.minutes.length > 0) {
            lastMinutesID = this.minutes[this.minutes.length -1];
            lastMinutes = Minutes.findOne(lastMinutesID);
            if (lastMinutes) {
                return lastMinutes
            }
        }
        return false;
    }
});
