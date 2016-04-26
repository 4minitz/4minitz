
import { MeetingSeries } from '/imports/meetingseries'

Template.minutesList.helpers({
    buttonBackground: function () {
        return (this.isFinalized) ? "default" : "info";
    }
});

Template.minutesList.events({
    "click #deleteMinutes": function () {
        console.log("Remove Meeting Minute " + this._id + " from Series: " + this.meetingSeries_id);
        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                let ms = new MeetingSeries(this.meetingSeries_id);
                ms.removeMinutesWithId(this._id);
            },
            /* Dialog content */
            "Do you really want to delete this meeting minute?"
        );
    }
});