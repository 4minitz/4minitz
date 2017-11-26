import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Migrations } from 'meteor/percolate:migrations';

import { MeetingSeriesSchema } from './../../imports/collections/meetingseries.schema';
import { MinutesSchema } from './../../imports/collections/minutes.schema';
import { TestMailCollection } from '/imports/mail/TestMail';
import { Minutes } from './../../imports/minutes';
import { AttachmentsCollection } from '/imports/collections/attachments_private';
import { DocumentsCollection } from '/imports/collections/documentgeneration_private';
import { BroadcastMessageSchema } from '/imports/collections/broadcastmessages.schema';
import { TopicSchema } from '/imports/collections/topic.schema';
import { DocumentGeneration } from '/imports/documentGeneration';
import {TopicsFinder} from '../../imports/services/topicsFinder';

// Security: ensure that these methods only exist in End2End testing mode
if (Meteor.settings.isEnd2EndTest) {
    // Meteor.settings.isEnd2EndTest will be set via "--settings settings-test-end2end.json"
    console.log('End2End helpers loaded on server-side!');

    Meteor.methods({
        'e2e.resetMyApp'(skipUsers) {
            console.log('-------------------------- E2E-METHOD: resetMyApp ');
            AttachmentsCollection.remove({});
            console.log('Count AttachmentsCollection after reset:'+AttachmentsCollection.find().count());
            // remove the meeting series attachment dir
            MeetingSeriesSchema.getCollection().find().fetch().forEach(ms => {
                removeMeetingSeriesAttachmentDir(ms._id); //eslint-disable-line
            });
            MeetingSeriesSchema.remove({});
            console.log('Count MeetingSeries after reset:'+MeetingSeriesSchema.find().count());
            MinutesSchema.remove({});
            console.log('Count Minutes after reset:'+MinutesSchema.find().count());
            TestMailCollection.remove({});
            console.log('Count saved test mails after reset:'+TestMailCollection.find().count());
            BroadcastMessageSchema.remove({});
            TopicSchema.remove({});
            DocumentsCollection.remove({});
            console.log('Count Protocls after reset:' + DocumentsCollection.find().count());
            resetDocumentStorageDirectory(); //eslint-disable-line

            if (!skipUsers) {
                // Reset users and create our e2e test users
                Meteor.users.remove({});
                for (let i in Meteor.settings.e2eTestUsers) {
                    let newUser = Meteor.settings.e2eTestUsers[i];
                    let newPassword = Meteor.settings.e2eTestPasswords[i];
                    let newEmail = Meteor.settings.e2eTestEmails[i];
                    Accounts.createUser({username: newUser, password: newPassword, email: newEmail});
                    Meteor.users.update({'username': newUser}, {$set: {'emails.0.verified': true}});
                    console.log('Created user: ' + newUser + ' with password: ' + newPassword);
                }
                if (Meteor.settings.e2eAdminUser) {
                    Meteor.users.update({'username': Meteor.settings.e2eAdminUser}, {$set: {'isAdmin': true}});
                }
            } else {
                console.log('skip resetting users');
            }
        },
        'e2e.getServerCurrentWorkingDir'() {
            console.log('-------------------------- E2E-METHOD: getServerCurrentWorkingDir');
            return (process.cwd());
        },
        'e2e.getServerAttachmentsDir'() {
            console.log('-------------------------- E2E-METHOD: getServerAttachmentsDir');
            return calculateAndCreateStoragePath(); //eslint-disable-line
        },
        'e2e.countMeetingSeriesInMongDB'() {
            console.log('-------------------------- E2E-METHOD: countMeetingSeries');
            return MeetingSeriesSchema.find({}).count();
        },
        'e2e.countMinutesInMongoDB'() {
            console.log('-------------------------- E2E-METHOD: countMinutesSeries');
            return MinutesSchema.find({}).count();
        },
        'e2e.countAttachmentsInMongoDB'() {
            console.log('-------------------------- E2E-METHOD: countAttachmentsInMongoDB');
            return AttachmentsCollection.find({}).count();
        },
        'e2e.getAttachmentsForMinute'(minID) {
            console.log('-------------------------- E2E-METHOD: getAttachmentsForMinute');
            return AttachmentsCollection.find({'meta.meetingminutes_id': minID}).fetch();
        },
        'e2e.getPresentParticipantNames'(minutesId) {
            console.log('-------------------------- E2E-METHOD: getParticipantsString');
            let aMin = new Minutes(minutesId);
            return aMin.getPresentParticipantNames();
        },
        'e2e.updateMeetingSeries'(id, doc) {
            MeetingSeriesSchema.update(id, {$set: doc});
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
                    html: mail.html,
                    text: mail.text
                };
            });
        },
        'e2e.removeAllBroadcasts'() {
            BroadcastMessageSchema.remove({});
        },
        'e2e.findMeetingSeries'(MSid) {
            console.log('-------------------------- E2E-METHOD: findMeetingSeries');
            return MeetingSeriesSchema.getCollection().findOne(MSid);
        },
        'e2e.getTopicsOfMeetingSeries'(MSid) {
            console.log('-------------------------- E2E-METHOD: getTopicsOfMeetingSeries');
            return TopicsFinder.allTopicsOfMeetingSeries(MSid);
        },
        'e2e.countProtocolsInMongoDB'() {
            console.log('-------------------------- E2E-METHOD: countProtocolsInMongoDB');
            return DocumentsCollection.find({}).count();
        },
        'e2e.setSettingsForProtocolGeneration'(format) {
            console.log('-------------------------- E2E-METHOD: setSettingsForProtocolGeneration');
            //This method sets the document generation to specific settings.
            //An empty format parameter will lead to deactivation of the document generation
            if (!Meteor.settings.docGeneration) {
                Meteor.settings.docGeneration = {};
            }
            if (!Meteor.settings.public.docGeneration) {
                Meteor.settings.public.docGeneration = {};
            }

            Meteor.settings.docGeneration.enabled = !!format;
            Meteor.settings.public.docGeneration.enabled = Meteor.settings.docGeneration.enabled;

            if (format) {
                Meteor.settings.docGeneration.format = format;
                Meteor.settings.public.docGeneration.format = Meteor.settings.docGeneration.format;
            }
        },
        'e2e.getProtocolStoragePathForMinute'(minuteId) {
            console.log('-------------------------- E2E-METHOD: getProtocolStoragePathForMinute');
            let protocol = DocumentGeneration.getProtocolForMinute(minuteId);
            return (protocol ? protocol.path : undefined);
        },
        'e2e.getProtocolLinkForMinute'(minuteId) {
            console.log('-------------------------- E2E-METHOD: getProtocolLinkForMinute');
            let protocol = DocumentGeneration.getProtocolForMinute(minuteId);
            return (protocol ? protocol.link() : undefined);
        },
        'e2e.getUserRole'(MSid, i){
            console.log('-------------------------- E2E-METHOD: getUserRole');
            let usr = Meteor.users.findOne({username: Meteor.settings.e2eTestUsers[i]});
            if (usr.roles && usr.roles[MSid] && usr.roles[MSid][0]){
                return usr.roles[MSid][0];
            }
            return null;
        },
        'e2e.findMinute'(minuteID){
            console.log('-------------------------- E2E-METHOD: findMinute');
            return MinutesSchema.getCollection().findOne(minuteID);
        },
        'e2e.getUserId'(i){
            console.log('-------------------------- E2E-METHOD: getUserId');
            let usr = Meteor.users.findOne({username: Meteor.settings.e2eTestUsers[i]});
            return usr._id;
        },
        'e2e.countTopicsInMongoDB'(minuteID) {
            console.log('-------------------------- E2E-METHOD: countTopicsInMongoDB');
            let minId = MinutesSchema.getCollection().findOne(minuteID);
            return minId.topics.length;
        },
        'e2e.getTopics'(minuteID){
            console.log('-------------------------- E2E-METHOD: getTopics');
            let min = MinutesSchema.getCollection().findOne(minuteID);
            return min.topics;
        },
        'e2e.triggerMigration'(version) {
            console.log('-------------------------- E2E-METHOD: triggerMigration');
            Migrations.migrateTo(version);
        }
    });
}
