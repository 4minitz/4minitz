
import { MeetingSeries } from '/imports/meetingseries'

Template.minutesList.helpers({
    buttonBackground: function () {
        return (this.isFinalized) ? "default" : "info";
    },

    addMinutesPath: function () {
        let ms = new MeetingSeries(this.meetingSeriesId);
        return (ms.addNewMinutesAllowed()) ? "/minutesadd/" + this.meetingSeriesId : "";
    },

    addMinutesNotAllowed: function () {
        let ms = new MeetingSeries(this.meetingSeriesId);
        return !ms.addNewMinutesAllowed();
    },

    isDeleteAllowed: function () {
        return (!this.isFinalized &&  !this.isUnfinalized);
    }
});

Template.minutesList.events({
    "click #deleteMinutes": function (evt) {
        let disabled = evt.currentTarget.getAttribute('disabled');
        if (disabled) return;

        console.log("Remove Meeting Minute " + this._id + " from Series: " + this.meetingSeries_id);

        let dialogContent = "Do you really want to delete this meeting minute dated on <strong>" + this.date + "</strong>?";
        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                let ms = new MeetingSeries(this.meetingSeries_id);
                ms.removeMinutesWithId(this._id);
            },
            /* Dialog content */
            dialogContent
        );
    },

    "click #deleteMeetingSeries": function() {
        console.log("Remove Meeting Series"+this._id);
        let ms = new MeetingSeries(this.meetingSeriesId);

        let countMinutes = ms.countMinutes();

        //let dialogContent = "";

        let seriesName = "<strong>" + ms.project + ": " + ms.name + "</strong>";

        let dialogContent = "<p>Do you really want to delete the meeting series " + seriesName + "?</p>";

        if (countMinutes !== 0) {
            let lastMinDate = ms.lastMinutes().date;
            dialogContent += "<p>This series contains " + countMinutes
                + " meeting minutes (last minutes of " + lastMinDate + ").</p>";
        }

        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                MeetingSeries.remove(ms);
                Router.go("/");
            },
            dialogContent
        );
    }

});