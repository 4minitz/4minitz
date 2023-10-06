import { Meteor} from 'meteor/meteor';

export class MigrateV14 {

    static up() {
        const demoUser = Meteor.users.findOne({'$and': [
            {'username': 'demo'},
            {'isDemoUser': true}
        ]});
        if (demoUser) {
            Meteor.users.update({'username': 'demo'}, {$set: {'emails.0.verified': true}});
        }
    }

    static down() {
        const demoUser = Meteor.users.findOne({'$and': [
            {'username': 'demo'},
            {'isDemoUser': true}
        ]});
        if (demoUser) {
            Meteor.users.update({'username': 'demo'}, {$set: {'emails.0.verified': false}});
        }
    }

}
