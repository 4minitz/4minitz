import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.resetPassword.events({
    'submit #at-pwd-form': function (event) {
        event.preventDefault();
        let token = FlowRouter.getParam("token");
        Accounts.resetPassword(token, $('#at-field-password').val(), ( error ) =>{
            if ( error ) {
                alert(error.reason);
            } else {
                FlowRouter.go( '/' );
                alert('Password sucessfully reseted! Thanks!');
            }
        });
    }
});
