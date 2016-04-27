import { MeetingSeries } from '/imports/meetingseries'


Template.meetingSeriesList.onCreated(function () {
});


Template.meetingSeriesList.onRendered(function () {
    $.material.init();
});


Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
    }
});

Template.meetingSeriesList.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click #deleteMeetingSeries": function() {
        console.log("Remove Meeting Series"+this._id);

        let countMinutes = this.countMinutes();

        let dialogContent = "";

        if (countMinutes !== 0) {
            let lastMinDate = this.lastMinutes().date;
            dialogContent = "<p>This series contains " + countMinutes
                + " meeting minutes (last minutes of " + lastMinDate + ").</p>";
        }

        dialogContent += "<p>Do you really want to delete this meeting series?</p>";

        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                MeetingSeries.remove(this);
            },
            dialogContent
        );
    }
});
