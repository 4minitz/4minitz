
var _meeting;   // the parent meeting of this minutes

Template.minutesadd.created = function () {
    _meeting = this.data;
};

Template.minutesadd.onRendered(function () {
    // Initialize the datepicker control
    $('.datepicker').pickadate({  // for all datepicker options see: http://amsul.ca/pickadate.js/date/
        format: 'yyyy-mm-dd'
    });
});

Template.minutesadd.helpers({
    meeting: function() {
        return _meeting;
    },

    currentDate: function() {
        return new Date();
    }
});

Template.minutesadd.events({
    "click #btnSave": function (evt, template) {
        console.log("Saving Minutes...");
        aDate = template.find("#id_date").value;
        theParticipants = template.find("#id_participants").value;
        aText = template.find("#id_text").value;
        if (aDate == "" || theParticipants == "" || aText == "") {
            return;
        }

        Meteor.call("addMinutes", _meeting._id, aDate, theParticipants, aText);
    }
});
