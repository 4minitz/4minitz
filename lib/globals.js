
////////// Client & Server Code! /////////
Meteor.methods({

    addMeeting: function (aProject, aName) {
        console.log("Adding meeting: "+ aProject + ":" + aName);
        Meetings.insert({
            project: aProject,
            name: aName,
            createdAt: new Date()
        });

    },

    deleteMeeting: function(meetingId) {
        console.log("Delete meeting: "+meetingId);
        Meetings.remove(meetingId);
    },


    addMinutes: function (aParentMeetingID, aDate, theParticipants, aText) {
        console.log("addMinutes");
        Minutes.insert ({
            meeting_id: aParentMeetingID,
            date: aDate,
            participants: theParticipants,
            text: aText
        }, function(err, newMinutesID) {  // get the _id of the freshly inserted minutes!
            if (!err) {
                // store this new minutes ID to the parent meeting's array "minutes"
                var parentMeeting = Meetings.findOne(aParentMeetingID);
                var childMinutes = parentMeeting.minutes;
                if (!childMinutes) {
                    childMinutes = [];
                }
                childMinutes.push(newMinutesID);
                Meetings.update(aParentMeetingID, {$set: {minutes: childMinutes}});
            }
        });
    }
});
