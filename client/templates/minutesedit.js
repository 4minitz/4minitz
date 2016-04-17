import { MeetingSeries } from '/imports/meetingseries'
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

    topicsArray: function () {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin.topics;
        }
        return null;
    }
});

Template.minutesedit.events({
    "dp.change #id_minutesdatePicker": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let aDate = tmpl.find("#id_minutesdateInput").value;
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
    }
});
