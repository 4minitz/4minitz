import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check'

import { User } from '/imports/users';
import { AdminRegisterUserMailHandler } from '/imports/mail/AdminRegisterUserMailHandler'

Meteor.methods({
    'users.saveSettings'(settings) {
        const user = new User();
        console.log(user);

        const id = Meteor.userId();
        Meteor.users.update(id, { $set: {settings} });
        console.log(`saved settings for user ${id}: ${settings}`);
        console.log(settings);
        console.log(user);
    },

    'users.admin.changePassword'(userId, password1, password2) {
        if (Meteor.isServer) {
            // #Security: Only logged in admin may invoke this method: users.admin.changePassword
            console.log("users.admin.changePassword for user: "+Meteor.userId());
            if (! Meteor.userId()) {
                throw new Meteor.Error("Cannot change password", "User not logged in.");
            }
            if (! Meteor.user().isAdmin) {
                throw new Meteor.Error("Cannot change password", "You are not admin.");
            }

            check(userId, String);
            check(password1, String);
            check(password2, String);
            if (password1 !== password2) {
                throw new Meteor.Error("Cannot change password", "Passwords do not match");
            }
            if (! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password1)) {
                throw new Meteor.Error("Cannot change password", "Password: min. 6 chars (at least 1 digit, 1 lowercase and 1 uppercase)");
            }

            Accounts.setPassword(userId, password1, {logout: false});
        }
    },

    'users.admin.registerUser'(username, longname, email, password1, password2, sendMail, sendPassword) {
        console.log("users.admin.registerUser for user: "+username);
        // #Security: Only logged in admin may invoke this method: users.admin.registerUser
        if (! Meteor.userId()) {
            throw new Meteor.Error("Cannot register user", "User not logged in.");
        }
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error("Cannot register user", "You are not admin.");
        }

        global.checkWithMsg (username, Match.Where(function (x) {
            check(x, String);
            return x.length > 2;
        }), "Username: at least 3 characters");
        check(password1, String);
        check(password2, String);
        check(sendMail, Boolean);
        check(sendPassword, Boolean);
        if (password1 !== password2) {
            throw new Meteor.Error("Cannot register user", "Passwords do not match");
        }
        if (! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password1)) {
            throw new Meteor.Error("Cannot register user", "Password: min. 6 chars (at least 1 digit, 1 lowercase and 1 uppercase)");
        }
        global.checkWithMsg (email, Match.Where(function (x) {
            check(x, String);
            return global.emailAddressRegExpTest.test(x);
        }), "EMail address not valid");

        let newUserId = Accounts.createUser({username: username,
                                            password: password1,
                                            email: email,
                                            profile: {name: longname}});

        if (Meteor.isServer && newUserId && sendMail) {
            let mailer = new AdminRegisterUserMailHandler(newUserId, sendPassword, password1);
            mailer.send();
        }
    },


    "users.admin.ToggleInactiveUser"(userId) {
        console.log("users.admin.ToggleInactiveUser for "+userId);
        // #Security: Only logged in admin may invoke this method: users.admin.ToggleInactiveUser
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error("Cannot toggle inactive user", "You are not admin.");
        }
        let usr = Meteor.users.findOne(userId);
        if (usr) {
            if (usr.isInactive) {
                Meteor.users.update({ _id: userId }, { $unset: { 'isInactive': '' }});
            } else {
                Meteor.users.update({_id: userId}, {$set: { isInactive: true }});
                // Logout user
                Meteor.users.update({ _id: userId }, {$set: { "services.resume.loginTokens" : [] }});
            }
        } else {
            console.error("Could not find user:"+userId+" to toggle isInactive");
        }
    }
});
