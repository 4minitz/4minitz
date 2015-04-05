var _minute;   // minutes of the template

Template.minutesshow.created = function () {
    _minute = this.data;
};

Template.minutesshow.helpers({
    minute: function() {
        return _minute;
    },
    meeting: function() {
        return Meetings.findOne(_minute.meeting_id);
    }
});

Template.minutesshow.events({
    "click #btnOK": function () {
        window.history.back();
    }
});
