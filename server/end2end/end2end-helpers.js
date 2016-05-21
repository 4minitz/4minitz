
import { MeetingSeriesCollection } from './../../imports/collections/meetingseries_private';
import { MinutesCollection } from './../../imports/collections/minutes_private';


// Security: ensure that these methods only exist in End2End testing mode
if (Meteor.settings.isEnd2EndTest) {
    // Meteor.settings.isEnd2EndTest will be set via "--settings settings-test-end2end.json"
    console.log("End2End helpers loaded on server-side!");

    Meteor.methods({
        'e2e.resetMyApp'() {
            console.log("-------------------------- E2E-METHOD: resetMyApp ");
            MeetingSeriesCollection.remove({});
            console.log("Count MeetingSeries after reset:"+MeetingSeriesCollection.find().count());
            MinutesCollection.remove({});
            console.log("Count Minutes after reset:"+MinutesCollection.find().count());

            // Reset users and create our e2e test users
            Meteor.users.remove({});
            for (let i in Meteor.settings.e2eTestUsers) {
                let newUser = Meteor.settings.e2eTestUsers[i];
                let newPassword = Meteor.settings.e2eTestPasswords[i];
                Accounts.createUser({username: newUser, password: newPassword});
                console.log("Created user: "+newUser+" with password: "+newPassword);
            }
        },
        'e2e.countMeetingSeriesAll'() {
            console.log("-------------------------- E2E-METHOD: countMeetingSeries");
            return MeetingSeriesCollection.find({}).count();
        },
        'e2e.countMinutesAll'() {
            console.log("-------------------------- E2E-METHOD: countMinutesSeries");
            return MinutesCollection.find({}).count();
        }
    });
}
