import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Minutes } from '../minutes';
import { MeetingSeries } from '../meetingseries';
import { UserRoles } from './../userroles';
import { MinutesSchema } from './minutes.schema';
import { FinalizeMailHandler } from '../mail/FinalizeMailHandler';
import { SendAgendaMailHandler } from '../mail/SendAgendaMailHandler';
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
    'minutes.sendAgenda'(id) {
        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user is moderator before sending the agenda
        let userRoles = new UserRoles(Meteor.userId());
        let aMin = new Minutes(id);
        if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
            if (!GlobalSettings.isEMailDeliveryEnabled()) {
                console.log("Skip sending mails because email delivery is not enabled. To enable email delivery set enableMailDelivery to true in your settings.json file");
                throw new Meteor.Error("Cannot send agenda", "Email delivery is not enabled in your 4minitz installation.");
            }

            if (Meteor.isServer) {
                let emails = Meteor.user().emails;
                let senderEmail = (emails && emails.length > 0)
                    ? emails[0].address
                    : GlobalSettings.getDefaultEmailSenderAddress();
                let sendAgendaMailHandler = new SendAgendaMailHandler(senderEmail, aMin);
                sendAgendaMailHandler.send();

                MinutesCollection.update({_id: aMin._id, isFinalized: false}, {$set: {agendaSentAt: new Date()}});

                return sendAgendaMailHandler.getCountRecipients();
            }
        } else {
            throw new Meteor.Error("Cannot send agenda", "You are not moderator of the parent meeting series.");
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
