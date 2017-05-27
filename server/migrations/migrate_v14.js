import { Meteor} from 'meteor/meteor';

export class MigrateV14 {

    static up() {
        let demoUser = Meteor.users.findOne({'username': 'demo'});
        if (demoUser) {
            Meteor.users.update({'username': 'demo'}, {$set: {'emails.0.verified': true}});
            if (demoUser.emails[0].verified === undefined) {
                Meteor.users.update({'username': 'demo'}, {$set: {'emails.0.verified': true}});
            }
        }
    }

    static down() {
        let demoUser = Meteor.users.findOne({'username': 'demo'});
        if (demoUser) {
            Meteor.users.update({'username': 'demo'}, {$set: {'emails.0.verified': false}});
        }
    }

}
