import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import {FlashMessage} from "../../helpers/flashMessage";

Template.resetPassword.events({
    'submit #at-pwd-form': function (event) {
        event.preventDefault();
        let token = FlowRouter.getParam("token");
        Accounts.resetPassword(token, $('#at-field-password').val(), ( error ) =>{
            if ( error ) {
                (new FlashMessage('Error', error.reason)).show();
            } else {
                FlowRouter.go( '/' );
                (new FlashMessage('', 'Password sucessfully reseted!', 'alert-success')).show();
            }
        });
    }
});
