var _meeting;   // the parent meeting of this minutes

Template.minuteslist.created = function () {
    _meeting = this.data;
};

Template.minuteslist.helpers({
    meeting: function() {
        return _meeting;
    },

    minutes: function() {
        var meeting = Meetings.findOne(_meeting._id);
        var minIDs = meeting.minutes;
        var results = [];
        for (index = 0; index < minIDs.length; ++index) {
            var id = minIDs[index];
            var min = Minutes.findOne(id);
            results.push (min);
        }
        return results;
    }
});

Template.minuteslist.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
