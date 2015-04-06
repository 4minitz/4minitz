var _minutesID;   // minutes ID of the template

Template.minutesshow.created = function () {
    _minutesID = this.data;

};

Template.minutesshow.helpers({
    minute: function() {
        return Minutes.findOne(_minutesID);
    },
    meeting: function() {
        var min = Minutes.findOne(_minutesID);
        return Meetings.findOne(min.meeting_id);
    },

    topicsArray: function () {
        var min = Minutes.findOne(_minutesID);
        Meteor.defer(function () {  // activate the new added collapsible!
            $('.collapsible').collapsible();
        });

        return min.topics;
    }
});

Template.minutesshow.events({
    "click #btnOK": function () {
        window.history.back();
    }
});
