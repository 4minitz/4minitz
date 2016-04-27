import { Minutes } from '/imports/minutes'

var _minutesID; // the ID of these minutes

Template.minutesedit.onCreated(function () {
    _minutesID = this.data;
});

Template.minutesedit.onRendered(function () {
    this.$('#id_minutesdatePicker').datetimepicker(
        {
            format: "YYYY-MM-DD"
        }
    );
});

Template.minutesedit.helpers({
    meetingSeries: function() {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin.parentMeetingSeries();
        }
        return null;
    },

    minutes: function () {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin;
        }
        return null;
    },

    isFinalized: function () {
        let aMin = new Minutes(_minutesID);
        return aMin.isFinalized;
    },

    getFinalizedDate: function () {
        let aMin = new Minutes(_minutesID);
        return formatDateISO8601(aMin.finalizedAt); // TODO: format date!
    },

    getFinalizedBy: function () {
        let aMin = new Minutes(_minutesID);
        return Meteor.users.findOne({_id: aMin.finalizedBy});
    },

    readOnlyIfFinalized: function () {
        let aMin = new Minutes(_minutesID);
        return (aMin.isFinalized) ? "readonly" : "";
    }
});

Template.minutesedit.events({
    "dp.change #id_minutesdatePicker": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            if (aMin.isFinalized) {
                // event will be called on page load
                // if the meeting is already finalized nothing has to be updated
                return;
            }

            let dateNode = tmpl.$("#id_minutesdateInput");
            let aDate = tmpl.find("#id_minutesdateInput").value;


            dateNode.parent().removeClass("has-error");
            if (!aMin.parentMeetingSeries().isMinutesDateAllowed(aMin._id, aDate)) {
                dateNode.parent().addClass("has-error");
                tmpl.find("#id_minutesdateInput").value = aMin.date;
                return;
            }

            aMin.update({date: aDate});
        }
    },

    "change #id_participants": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let theParticipant = tmpl.find("#id_participants").value;
            aMin.update({participants: theParticipant});
        }
    },

    "change #id_agenda": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let anAgenda = tmpl.find("#id_agenda").value;
            aMin.update({agenda: anAgenda});
        }
    },

    'click #btn_finalizeMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.finalizeMinutes(aMin);
        }
    },

    'click #btn_unfinalizeMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Un-Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.unfinalizeMinutes(aMin);
        }
    }
});
