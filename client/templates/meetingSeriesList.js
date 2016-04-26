import { MeetingSeries } from '/imports/meetingseries'

Template.meetingSeriesList.onRendered(function () {
});


Template.meetingSeriesList.onCreated(function () {
});

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
    }
});

Template.meetingSeriesOverview.helpers({
    addMinutesPath: function () {
        let ms = new MeetingSeries(this._id);
        return (ms.addNewMinutesAllowed()) ? "/minutesadd/" + this._id : "";
    },

    addMinutesNotAllowed: function () {
        let ms = new MeetingSeries(this._id);
        return !ms.addNewMinutesAllowed();
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
