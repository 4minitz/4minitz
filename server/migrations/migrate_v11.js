import { Meteor} from 'meteor/meteor';

// add isDemoUser:true to username: demo with expected "demo" password
export class MigrateV11 {

    static up() {
        let demoUser = Meteor.users.findOne({"username": "demo"});
        if (demoUser) {
            Meteor.users.update({"username": "demo"}, {$set: {isDemoUser: true}});
            if (demoUser.isInactive === undefined) {
                Meteor.users.update({"username": "demo"}, {$set: {isInactive: false}});
            }
        }
    }

    static down() {
        let demoUser = Meteor.users.findOne({"username": "demo"});
        if (demoUser) {
            Meteor.users.update({"username": "demo"}, {$unset: {isDemoUser: false}});
        }
    }
}
