
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
        if (_minutesID && _minutesID != "") {
            var min = Minutes.findOne(_minutesID);
            if (min) {
                ms = MeetingSeries.findOne(min.meetingSeries_id);
                return ms
            }
        }
        return null;
    },

    minutes: function () {
        if (_minutesID && _minutesID != "") {
            var min = Minutes.findOne(_minutesID);
            if (min) {
                return min;
            }
        }
        return null;
    },

    topicsArray: function () {
        if (_minutesID && _minutesID != "") {
            var min = Minutes.findOne(_minutesID);
            if (min) {
                return min.topics;
            }
        }
    }
});

Template.minutesedit.events({
    "dp.change #id_minutesdatePicker": function (evt, tmpl) {
        var min = Minutes.findOne(_minutesID);
        if (min) {
            var aDate = tmpl.find("#id_minutesdateInput").value;
            Minutes.update(_minutesID, {$set: {date: aDate}});
        }
    },

    "change #id_participants": function (evt, tmpl) {
        var theParticipant = tmpl.find("#id_participants").value;
        var min = Minutes.findOne(_minutesID);
        if (min) {
            Minutes.update(_minutesID, {$set: {participants: theParticipant}});
        }
    },

    "change #id_agenda": function (evt, tmpl) {
        var min = Minutes.findOne(_minutesID);
        if (min) {
            var anAgenda = tmpl.find("#id_agenda").value;
            Minutes.update(_minutesID, {$set: {agenda: anAgenda}});
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

        if (_minutesID && _minutesID != "") {
            var min = Minutes.findOne(_minutesID);
            if (min) {
                aDate = formatDateISO8601(new Date());
                var topic =
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

                var topics = min.topics;
                topics.unshift(topic);  // add to front of array
                Minutes.update(_minutesID, {$set: {topics: topics}});
            }
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
