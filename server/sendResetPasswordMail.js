import { Meteor } from 'meteor/meteor';

// We wrap the original Accounts.sendResetPasswordEmail to perform
// a check for user.isLDAPuser in advance. Because LDAP users
// should not be able to change their passwords via this WebApp.
let originalSendResetPasswordEmail = Accounts.sendResetPasswordEmail;
Accounts.sendResetPasswordEmail = function (userId, email) {
    let user = Meteor.users.findOne(userId);
    if (user.isLDAPuser) {
        throw new Meteor.Error( 418, 'LDAP users are not allowed to reset their password with \'Standard\' login' );
    }
    originalSendResetPasswordEmail(userId, email);
};
