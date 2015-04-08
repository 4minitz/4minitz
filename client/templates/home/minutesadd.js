
var _meeting;   // the parent meeting of this minutes
var _minutesID; // the ID of these minutes

Template.minutesadd.created = function () {
    _meeting = this.data;
};

Template.minutesadd.onRendered(function () {
    // Initialize the datepicker control
    $('#id_date').pickadate({  // for all datepicker options see: http://amsul.ca/pickadate.js/date/
        format: 'yyyy-mm-dd',
        closeOnSelect: true,
        firstDay: 1
    });
    $('#id_duedate').pickadate({  // for all datepicker options see: http://amsul.ca/pickadate.js/date/
        format: 'yyyy-mm-dd',
        closeOnSelect: true,
        firstDay: 1
    });

    $('.modal-trigger').leanModal({
            dismissible: false, // Modal can be dismissed by clicking outside of the modal
            // complete: function() { alert('Closed'); } // Callback for Modal close
            ready: function() {
                    Meteor.defer(function () {  // wait for DOM update, then set focus on edit
                        var input = $('#id_subject');
                        if (input) {
                            input.focus();
                        }
                    })
            } // Callback for Modal open
        }
    );

    var aDate = this.find("#id_date").value;
    console.log(_meeting);
    console.log(_minutesID);
     Meteor.call("initializeMinutes", _meeting._id, aDate);
});

Template.minutesadd.helpers({
    meeting: function() {
        return _meeting;
    },

    currentDatePlusDeltaDays: function(deltaDays) {     // TODO: does not work with deltaDays!  :-(
        var aDate = new Date();
        console.log("DD:"+deltaDays);
        if (deltaDays) {
            aDate.setDate(aDate.getDate() + deltaDays);
            console.log("ad:"+aDate);
        }
        return aDate;
    },

    currentMinutesID: function () {
        _minutesID = Session.get("currentMinutesID");   // HACK to bring Session result to local var
        return _minutesID;
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

Template.minutesadd.events({
    "change #id_date": function (evt, tmpl) {
        console.log("1");
        var min = Minutes.findOne(_minutesID);
        if (min) {
            console.log("2");
            var aDate = tmpl.find("#id_date").value;
            Minutes.update(_minutesID, {$set: {date: aDate}});
        }
    },

    "change #id_participants": function (evt, tmpl) {
        var min = Minutes.findOne(_minutesID);
        if (min) {
            var theParticipant = tmpl.find("#id_participants").value;
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

                Meteor.defer(function () {  // activate the new added collapsible!
                    $('.collapsible').collapsible();
                })
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
