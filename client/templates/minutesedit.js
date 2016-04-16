import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

var _minutesID; // the ID of these minutes

Template.minutesedit.created = function () {
    _minutesID = this.data;
};

Template.minutesedit.onRendered(function () {
    this.$('#id_minutesdatePicker').datetimepicker(
        {
            format: "YYYY-MM-DD"
        }
    );
    this.$('#id_duedatePicker').datetimepicker(
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
    },

    "click #btnOK": function (evt, tmpl) {
        evt.preventDefault();
        var aSubject = tmpl.find("#id_subject").value;
        var aPriority = tmpl.find("#id_priority").value;
        var aResponsible = tmpl.find("#id_responsible").value;
        var aDuedate = tmpl.find("#id_duedateInput").value;
        var aDetails = tmpl.find("#id_details").value;
        if (aSubject == "") {
            return;
        }

        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let aDate = formatDateISO8601(new Date());
            var topic =                             // TODO: Use to-be-created Topic class for this!
            {
                subject: aSubject,
                responsible: aResponsible,
                priority: aPriority,
                duedate: aDuedate,
                state: "open",
                details: [{
                    date: aDate,
                    text: aDetails
                }]  // end-of details
            }; // end-of topic

            var topics = aMin.topics;
            topics.unshift(topic);  // add to front of array
            aMin.update({topics: topics});
        }
        // Hide modal dialog
        $('#dlgAddTopic').modal('hide')
    },

    "hidden.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#frmDlgAddTopic')[0].reset();
    },

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        tmpl.find("#id_duedateInput").value = currentDatePlusDeltaDays(7);
        tmpl.find("#id_subject").focus();
    }
});

var currentDatePlusDeltaDays = function(deltaDays) {
    var aDate = new Date();
    if (deltaDays) {
        aDate.setDate(aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};
