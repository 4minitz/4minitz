import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { FlowRouter } from 'meteor/kadira:flow-router';

// For possible account configuration see:
// https://github.com/meteor-useraccounts/core/blob/master/Guide.md#configuration-api

AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');

AccountsTemplates.addFields([
    {
        _id: 'username',
        type: 'text',
        displayName: 'User name',
        placeholder: {
            signUp: '(min. 3 chars)'
        },
        required: true,
        minLength: 3
    },
    {
        _id: 'name',
        type: 'text',
        displayName: 'Name, Company',
        placeholder: {
            signUp: 'John Doe, Happy Corp.'
        },
    },
    {
        _id: 'email',
        type: 'email',
        required: true,
        displayName: 'Email',
        re: /^[^\s@]+@([^\s@]+){2,}\.([^\s@]+){2,}$/,
        errStr: 'Invalid email'
    },

    {
        _id: 'password',
        type: 'password',
        placeholder: {
            signUp: 'min. 6 chars (digit, lower & upper)'
        },
        required: true,
        minLength: 6,
        re: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
        errStr: 'min. 6 chars (min. 1 digit, 1 lower, 1 upper)'
    }
]);

let submitHookFunction = function(error, state){
    if (state === "signUp") {
        if (error) {
            window.location.href = Meteor.absoluteUrl("login");
        }
    }
    else if (state === "signIn") {
        if (!error) {
            FlowRouter.go('/');
        }
    }
};

if (Meteor.isServer) {
    // #Security: Do not allow registering by anonymous visitors. Configurable via settings.json
    AccountsTemplates.configure({
        forbidClientAccountCreation: (Meteor.settings.forbidClientAccountCreation
                                        ? Meteor.settings.forbidClientAccountCreation
                                        : false),

        sendVerificationEmail: (Meteor.settings.email.enableMailDelivery === true && Meteor.settings.email.sendVerificationEmail
            ? Meteor.settings.email.sendVerificationEmail
            : false),

        showResendVerificationEmailLink: (Meteor.settings.email.enableMailDelivery === true && Meteor.settings.email.showResendVerificationEmailLink
            ? Meteor.settings.email.showResendVerificationEmailLink
            : false),

        showForgotPasswordLink: (Meteor.settings.email.enableMailDelivery === true && Meteor.settings.email.showForgotPasswordLink
            ? Meteor.settings.email.showForgotPasswordLink
            : false),

        onSubmitHook: submitHookFunction
    });

    // #Security: Do not allow "isInactive" users to log in
    Accounts.validateLoginAttempt(function(attempt) {
        if(attempt.user) {
            if (attempt.user.isInactive) {
                attempt.allowed = false;
                throw new Meteor.Error(403, 'User account is inactive!');
            }
            else if (Meteor.settings.email.sendVerificationEmail && !attempt.user.emails[0].verified) {
                attempt.allowed = false;
                throw new Meteor.Error(403, 'User account is not verified!');
            }
        }
        return true;
    });

} else {
    AccountsTemplates.configure({
        forbidClientAccountCreation: (Meteor.settings.public.forbidClientAccountCreation
                                        ? Meteor.settings.public.forbidClientAccountCreation
                                        : false),

        sendVerificationEmail: (Meteor.settings.public.enableMailDelivery === true && Meteor.settings.public.sendVerificationEmail
            ? Meteor.settings.public.sendVerificationEmail
            : false),

        showResendVerificationEmailLink: (Meteor.settings.public.enableMailDelivery === true && Meteor.settings.public.showResendVerificationEmailLink
            ? Meteor.settings.public.showResendVerificationEmailLink
            : false),

        showForgotPasswordLink: (Meteor.settings.public.enableMailDelivery === true && Meteor.settings.public.showForgotPasswordLink
            ? Meteor.settings.public.showForgotPasswordLink
            : false),

        onSubmitHook: submitHookFunction
    });
}


