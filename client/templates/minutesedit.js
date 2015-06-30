
var _minutesID; // the ID of these minutes

Template.minutesedit.created = function () {
    _minutesID = this.data;
};

Template.minutesedit.onRendered(function () {
});

Template.minutesedit.helpers({
    meeting: function() {
        if (_minutesID && _minutesID != "") {
            var min = Minutes.findOne(_minutesID);
            if (min) {
                return Meetings.findOne(min.meeting_id);
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
    },

    currentDatePlusDeltaDays: function(deltaDays) {     // TODO: does not work with deltaDays!  :-(
        var aDate = new Date();
        if (deltaDays) {
            aDate.setDate(aDate.getDate() + deltaDays);
            console.log("ad:"+aDate);
        }
        return aDate;
    }
});

Template.minutesedit.events({
    "change #id_minutesdate": function (evt, tmpl) {
        console.log("1");
        var min = Minutes.findOne(_minutesID);
        if (min) {
            console.log("2");
            var aDate = tmpl.find("#id_minutesdate").value;
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
        var aDuedate = tmpl.find("#id_duedate").value;
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
        // Clear form
        $('form')[0].reset();
    },

    "click #btnCancel": function (evt, tmpl) {
        console.log("BTN Cancel");
        // TODO: Add security question, if form is filled
    }
});
