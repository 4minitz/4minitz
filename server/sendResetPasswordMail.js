let originalSendResetPasswordEmail = Accounts.sendResetPasswordEmail;
Accounts.sendResetPasswordEmail = function (userId, email) {
    let user = Meteor.users.findOne(userId);
    if (user.isLDAPuser) {
        throw new Meteor.Error( 418, 'You are not allowed to reset your password' );
    }
    originalSendResetPasswordEmail(userId, email);
};
