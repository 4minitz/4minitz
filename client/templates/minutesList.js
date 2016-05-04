
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

    isDeleteNotAllowed: function () {
        return (this.isFinalized);
    }
});

Template.minutesList.events({
    "click #deleteMinutes": function (evt) {
        let disabled = evt.currentTarget.getAttribute('disabled');
        if (disabled) return;

        console.log("Remove Meeting Minute " + this._id + " from Series: " + this.meetingSeries_id);

        let dialogContent = "<p>Do you really want to delete this meeting minute dated on <strong>" + this.date + "</strong>?</p>";
        let newTopicsCount = this.getNewTopics().length;
        if (newTopicsCount > 0) {
            dialogContent += "<p>This will remove <strong>" + newTopicsCount
                + " Topics</strong>, which were created within this minute.</p>";
        }
        let closedOldTopicsCount = this.getOldClosedTopics().length;
        if (closedOldTopicsCount > 0) {
            let additionally = (newTopicsCount > 0) ? "Additionally " : "";
            dialogContent += "<p>" + additionally + "<strong>" + closedOldTopicsCount
                + " topics</strong> will be opened again, which were closed whithin this minute.</p>"
        }

        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                let ms = new MeetingSeries(this.meetingSeries_id);
                ms.removeMinutesWithId(this._id);
            },
            /* Dialog content */
            dialogContent
        );
    }
});