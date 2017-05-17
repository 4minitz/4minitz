Template.home.created = function () {
    //add your statement here 
};

Template.home.events({
    'click .resend-verification-link' () {
        Meteor.call('sendVerificationLink', (error) => {
            if (error) {
                alert(error.reason);
            } else {
                let email = Meteor.user().emails[0].address;
                alert("Verification sent to " + email + "");
            }
        });
    }
});