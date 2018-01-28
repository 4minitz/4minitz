import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import {FlashMessage} from '../../helpers/flashMessage';

Template.resetPassword.events({
    'submit #at-pwd-form': function (event) {
        event.preventDefault();
        let token = FlowRouter.getParam('token');
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
