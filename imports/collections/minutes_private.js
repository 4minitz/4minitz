import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { UserRoles } from './../userroles';
import { MinutesSchema } from './minutes.schema';
import { FinalizeMailHandler } from '../mail/FinalizeMailHandler';
import { GlobalSettings } from './../GlobalSettings';

export var MinutesCollection = new Mongo.Collection("minutes",
    {
        transform: function (doc) {
            return new Minutes(doc);
        }
    }
);

if (Meteor.isServer) {
    Meteor.publish('minutes', function minutesPublication() {
        // publish only minutes visible for this user
        return MinutesCollection.find(
            {visibleFor: {$in: [this.userId]}});
    });
}
if (Meteor.isClient) {
    Meteor.subscribe('minutes');
}

MinutesCollection.attachSchema(MinutesSchema);

Meteor.methods({
    'minutes.insert'(doc, clientCallback) {
        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
           throw new Meteor.Error('not-authorized');
        }

        // It is not allowed to insert new minutes if the last minute was not finalized
        let parentMeetingSeries = new MeetingSeries(doc.meetingSeries_id);
        if (!parentMeetingSeries.addNewMinutesAllowed()) {
            // last minutes is not finalized!
            throw new Meteor.Error("Cannot create new Minutes", "Last Minutes must be finalized first.");
        }

        // It also not allowed to insert a new minute dated before the last finalized one
        parentMeetingSeries.isMinutesDateAllowed(/*we have no minutes_id*/null, doc.date);

        doc.isFinalized = false;
        doc.isUnfinalized = false;

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(doc.meetingSeries_id)) {
            MinutesCollection.insert(doc, function (error, newMinutesID) {
                doc._id = newMinutesID;
                if (!error) {
                    // store this new minutes ID to the parent meeting's array "minutes"
                    parentMeetingSeries.minutes.push(newMinutesID);
                    parentMeetingSeries.save();

                    if (Meteor.isClient && clientCallback) {
                        clientCallback(newMinutesID);
                    }
                }
            });
        } else {
            throw new Meteor.Error("Cannot create new minutes", "You are not moderator of the parent meeting series.");
        }
    },

    'minutes.finalize'(id, sendActionItems, sendInfoItems) {
        let doc = {
            finalizedAt: new Date(),
            finalizedBy: Meteor.user().username,
            isFinalized: true,
            isUnfinalized: false
        };

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        let aMin = new Minutes(id);
        if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
            MinutesCollection.update(id, {$set: doc}, /* options */null, function (error, affectedDocs) {
                if (!error && affectedDocs == 1 && Meteor.isServer) {
                    let emails = Meteor.user().emails;
                    Meteor.defer(() => { // server background tasks after successfully updated the minute doc
                        let senderEmail = (emails.length > 0)
                            ? emails[0].address
                            : GlobalSettings.getDefaultEmailSenderAddress();
                        let finalizeMailHandler = new FinalizeMailHandler(aMin, senderEmail);
                        finalizeMailHandler.sendMails(sendActionItems, sendInfoItems);
                    });
                }
            });
        } else {
            throw new Meteor.Error("Cannot finalize minutes", "You are not moderator of the parent meeting series.");
        }
    },

    'minutes.unfinalize'(id) {
        let doc = {
            isFinalized: false,
            isUnfinalized: true
        };

        // it is not allowed to un-finalize a minute if it is not the last finalized one
        let aMin = new Minutes(id);
        if (!aMin.parentMeetingSeries().isUnfinalizeMinutesAllowed(id)) {
            throw new Meteor.Error("not-allowed", "This minutes is not allowed to be un-finalized.");
        }

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
            MinutesCollection.update(id, {$set: doc});
        } else {
            throw new Meteor.Error("Cannot un-finalize minutes", "You are not moderator of the parent meeting series.");
        }
    },

    'minutes.update'(doc) {
        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let id = doc._id;
        delete doc._id; // otherwise collection.update will fail

        if (id == undefined || id == "") {
            return;
        }

        // delete properties which should not be modified by the client
        delete doc.finalizedAt;
        delete doc.createdAt;
        delete doc.isFinalized;

        let aMin = new Minutes(id);
        if (doc.date) {
            if (!aMin.parentMeetingSeries().isMinutesDateAllowed(id, doc.date)) {
                return;
            }
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
            // Ensure user can not update finalized minutes
            MinutesCollection.update({_id: id, isFinalized: false}, {$set: doc});
        }
    },


    'minutes.remove'(id) {
        if (id == undefined || id == "")
            return;

        var handleRemove = {
            removeMinute: function(id) {
                // Make sure the user is logged in before changing collections
                if (!Meteor.userId()) {
                    throw new Meteor.Error('not-authorized');
                }

                // Ensure user can not remove documents of other users
                let userRoles = new UserRoles(Meteor.userId());
                let aMin = new Minutes(id);
                if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
                    return MinutesCollection.remove({_id: id, isFinalized: false});
                } else {
                    throw new Meteor.Error("Cannot delete minutes", "You are not moderator of the parent meeting series.");
                }
            }
        };

        return handleRemove.removeMinute(id);
    },

    'minutes.removeAllOfSeries'(meetingSeriesId) {
        if (meetingSeriesId == undefined || meetingSeriesId == "") {
            return;
        }
        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not remove documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(meetingSeriesId)) {
            // deleting all minutes of one series is allowed, even if they are finalized.
            MinutesCollection.remove({meetingSeries_id: meetingSeriesId});
        } else {
            throw new Meteor.Error("Cannot delete all minutes", "You are not moderator of the parent meeting series.");
        }
    },

    'minutes.syncVisibility'(parentSeriesID, visibleForArray) {
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(parentSeriesID)) {
            if (MinutesCollection.find({meetingSeries_id: parentSeriesID}).count() > 0) {
                MinutesCollection.update({meetingSeries_id: parentSeriesID}, {$set: {visibleFor: visibleForArray}}, {multi: true});

                // add missing participants to non-finalized meetings
                MinutesCollection.find({meetingSeries_id: parentSeriesID}).forEach (min => {
                    if (!min.isFinalized) {
                        min.refreshParticipants(true);
                    }
                });
            }
        } else {
            throw new Meteor.Error("Cannot sync visibility of minutes", "You are not moderator of the parent meeting series.");
        }
    }
});
