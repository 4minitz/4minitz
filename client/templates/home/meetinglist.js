

Template.meetinglist.created = function () {
};


Template.meetinglist.helpers({
    meetings: function () {
        return Meetings.find({});
    }

});

Template.meetinglist.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click #deleteMeeting": function() {
        console.log("Delete");
        if (confirm("Do you really want to delete this meeting type?")) {
            Meteor.call("deleteMeeting", this._id);
        }
    }
});
