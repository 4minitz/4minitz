var _meeting;   // the parent meeting of this minutes

Template.meeting.created = function () {
    _meeting = Meetings.findOne(this.data);
};

Template.meeting.helpers({
    meeting: function() {
        return _meeting;
    },

    minutes: function() {
        var minIDs = _meeting.minutes;
        var results = [];
        for (index = 0; index < minIDs.length; ++index) {
            var id = minIDs[index];
            var min = Minutes.findOne(id);
            results.push (min);
        }
        return results;
    }
});

Template.meeting.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
