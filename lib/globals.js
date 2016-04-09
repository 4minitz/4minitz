
////////// Client & Server Code! /////////
Meteor.methods({

    addMeetingSeries: function (aProject, aName) {
        console.log("Adding meeting series: "+ aProject + ":" + aName);
        MeetingSeries.insert({
            project: aProject,
            name: aName,
            createdAt: new Date()
        });

    },

    deleteMeetingSeries: function(meetingId) {
        console.log("Delete meeting: "+meetingId);
        MeetingSeries.remove(meetingId);
    },



    addMinutes: function (aParentMeetingSeriesID, aDate) {
        console.log("addMinutes");
        Minutes.insert ({
            meetingSeries_id: aParentMeetingSeriesID,
            date: aDate,
            topics: []
        }, function(err, newMinutesID) {  // get the _id of the freshly inserted minutes!
            if (!err) {
                // store this new minutes ID to the parent meeting's array "minutes"
                var parentMeetingSeries = MeetingSeries.findOne(aParentMeetingSeriesID);
                var childMinutes = parentMeetingSeries.minutes;
                if (!childMinutes) {
                    childMinutes = [];
                }
                childMinutes.push(newMinutesID);
                MeetingSeries.update(aParentMeetingSeriesID, {$set: {minutes: childMinutes}});
                console.log("addMinutes: new _id:"+newMinutesID);

                // After we initialized the new minutes, we publish the ID via Session
                // This is needed by the minutesadd/ => minutesedit/ route
                if (Meteor.isClient) {
                    Session.set("currentMinutesID", newMinutesID);
                }
            }
        });
    }

});
