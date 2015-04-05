
var _meeting;   // the parent meeting of this minutes

Template.minutesadd.created = function () {
    _meeting = this.data;
};

Template.minutesadd.onRendered(function () {
  $('.datepicker').pickadate({
    //selectMonths: true, // Creates a dropdown to control month
    //selectYears: 15 // Creates a dropdown of 15 years to control year
  });
});

Template.minutesadd.helpers({
    meeting: function() {
        return _meeting;
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
