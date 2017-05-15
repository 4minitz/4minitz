import { Accounts } from 'meteor/accounts-base'

Accounts.emailTemplates.siteName = "4Minitz";
Accounts.emailTemplates.from     = "4Minitz <mail@4minitz.com>";

Accounts.emailTemplates.verifyEmail = {
    subject() {
        return "[4Minitz] Verify Your Email Address";
    },
    text( user, url ) {
        let emailAddress   = user.emails[0].address,
            urlWithoutHash = url.replace( '#/', '' ),
            supportEmail   = "mail@4minitz.com",
            emailBody      = `To verify your email address (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request this verification, please ignore this email. If you feel something is wrong, please contact our support team: ${supportEmail}.`;

        return emailBody;
    }
};

Accounts.emailTemplates.resetPassword = {
    subject() {
        return "[4Minitz] Reset Your Password";
    },
    text( user, url ) {
        let emailAddress   = user.emails[0].address,
            urlWithoutHash = url.replace( '#/', '' ),
            supportEmail   = "mail@4minitz.com",
            emailBody      = `To reset your password for (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request to reset your password, please ignore this email. If you feel something is wrong, please contact our support team: ${supportEmail}.`;

        return emailBody;
    }
};
