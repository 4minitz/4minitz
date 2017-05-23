let originalSendResetPasswordEmail = Accounts.sendResetPasswordEmail;
Accounts.sendResetPasswordEmail = function (userId, email) {
    let user = Meteor.users.findOne(userId);
    if (user.isLDAPuser) {
        return;
    }
    originalSendResetPasswordEmail(userId, email);
};
