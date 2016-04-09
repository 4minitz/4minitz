
////////// Client & Server Code! /////////
Meteor.methods({

    addMeeting: function (aProject, aName) {
        console.log("Adding meeting: "+ aProject + ":" + aName);
        MeetingSeries.insert({
            project: aProject,
            name: aName,
            createdAt: new Date()
        });

    },

    deleteMeeting: function(meetingId) {
        console.log("Delete meeting: "+meetingId);
        MeetingSeries.remove(meetingId);
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
                var parentMeeting = MeetingSeries.findOne(aParentMeetingID);
                var childMinutes = parentMeeting.minutes;
                if (!childMinutes) {
                    childMinutes = [];
                }
                childMinutes.push(newMinutesID);
                MeetingSeries.update(aParentMeetingID, {$set: {minutes: childMinutes}});
            }
        });
    },

    initializeMinutes: function (aParentMeetingID, aDate) {
        console.log("initializeMinutes");
        Minutes.insert ({
            meeting_id: aParentMeetingID,
            date: aDate,
            topics: []
        }, function(err, newMinutesID) {  // get the _id of the freshly inserted minutes!
            if (!err) {
                // store this new minutes ID to the parent meeting's array "minutes"
                var parentMeeting = MeetingSeries.findOne(aParentMeetingID);
                var childMinutes = parentMeeting.minutes;
                if (!childMinutes) {
                    childMinutes = [];
                }
                childMinutes.push(newMinutesID);
                MeetingSeries.update(aParentMeetingID, {$set: {minutes: childMinutes}});
                console.log("initializeMinutes:"+newMinutesID);

                // After we initialized the new minutes, we publish the ID via Session
                // This is needed by the minutesadd/ => minutesedit/ route
                if (Meteor.isClient) {
                    Session.set("currentMinutesID", newMinutesID);
                }
            }
        });
    }

});
