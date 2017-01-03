import { Meteor } from 'meteor/meteor';

import { MeetingSeriesCollection } from './../../imports/collections/meetingseries_private';
import { MinutesCollection } from './../../imports/collections/minutes_private';
import { TestMailCollection } from '/imports/mail/TestMail'
import { Minutes } from './../../imports/minutes';
import { AttachmentsCollection } from '/imports/collections/attachments_private';

// Security: ensure that these methods only exist in End2End testing mode
if (Meteor.settings.isEnd2EndTest) {
    // Meteor.settings.isEnd2EndTest will be set via "--settings settings-test-end2end.json"
    console.log("End2End helpers loaded on server-side!");

    Meteor.methods({
        'e2e.resetMyApp'(skipUsers) {
            console.log("-------------------------- E2E-METHOD: resetMyApp ");
            MeetingSeriesCollection.remove({});
            console.log("Count MeetingSeries after reset:"+MeetingSeriesCollection.find().count());
            MinutesCollection.remove({});
            console.log("Count Minutes after reset:"+MinutesCollection.find().count());
            TestMailCollection.remove({});
            console.log("Count saved test mails after reset:"+TestMailCollection.find().count());
            AttachmentsCollection.remove({});
            console.log("Count AttachmentsCollection after reset:"+AttachmentsCollection.find().count());

            if (!skipUsers) {
                // Reset users and create our e2e test users
                Meteor.users.remove({});
                for (let i in Meteor.settings.e2eTestUsers) {
                    let newUser = Meteor.settings.e2eTestUsers[i];
                    let newPassword = Meteor.settings.e2eTestPasswords[i];
                    let newEmail = Meteor.settings.e2eTestEmails[i];
                    Accounts.createUser({username: newUser, password: newPassword, email: newEmail});
                    console.log("Created user: " + newUser + " with password: " + newPassword);

                }
            } else {
                console.log("skip resetting users");
            }
        },
        'e2e.getServerCurrentWorkingDir'() {
            console.log("-------------------------- E2E-METHOD: getServerCurrentWorkingDir");
            return (process.cwd());
        },
        'e2e.countMeetingSeriesInMongDB'() {
            console.log("-------------------------- E2E-METHOD: countMeetingSeries");
            return MeetingSeriesCollection.find({}).count();
        },
        'e2e.countMinutesInMongoDB'() {
            console.log("-------------------------- E2E-METHOD: countMinutesSeries");
            return MinutesCollection.find({}).count();
        },
        'e2e.countAttachmentsInMongoDB'() {
            console.log("-------------------------- E2E-METHOD: countAttachmentsInMongoDB");
            return AttachmentsCollection.find({}).count();
        },
        'e2e.getPresentParticipantNames'(minutesId) {
            console.log("-------------------------- E2E-METHOD: getParticipantsString");
            let aMin = new Minutes(minutesId);
            return aMin.getPresentParticipantNames();
        },
        'e2e.updateMeetingSeries'(id, doc) {
            MeetingSeriesCollection.update(id, {$set: doc});
        },
        'e2e.resetTestMailDB'() {
            TestMailCollection.remove({});
        },
        'e2e.findSentMails'(...args) {
            return TestMailCollection.find(...args).map((mail) => {
                return {
                    _id: mail._id,
                    to: mail.to,
                    from: mail.from,
                    replyTo: mail.replyTo,
                    subject: mail.subject,
                    html: mail.html
                }
            });
        }
    });
}
