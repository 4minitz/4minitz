import {FlashMessage} from "../helpers/flashMessage";
Template.home.created = function () {
    //add your statement here 
};

Template.home.helpers({
    sendVerificationEmailEnabled(){
        return Meteor.settings.public.sendVerificationEmail;
    }
});

Template.home.events({
    'click .resend-verification-link' () {
        Meteor.call('sendVerificationLink', (error) => {
            if (error) {
                (new FlashMessage('Error', error.reason)).show();
            } else {
                let email = Meteor.user().emails[0].address;
                let message = 'Verification sent to ' + email;
                (new FlashMessage('', message, 'alert-success')).show();
            }
        });
    }
});