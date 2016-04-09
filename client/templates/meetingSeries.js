var _meetingSeries;   // the parent meeting object of this minutes

Template.meetingSeries.created = function () {
    _meetingSeries = MeetingSeries.findOne(this.data);
};

Template.meetingSeries.helpers({
    meetingSeries: function() {
        return _meetingSeries;
    },

    minutes: function() {
        var minIDs = _meetingSeries.minutes;
        var results = [];
        for (index = 0; index < minIDs.length; ++index) {
            var id = minIDs[index];
            var min = Minutes.findOne(id);
            results.push (min);
        }
        return results;
    }
});

Template.meetingSeries.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
