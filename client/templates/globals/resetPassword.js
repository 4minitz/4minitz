import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import {FlashMessage} from '../../helpers/flashMessage';
import { handleError } from '/client/helpers/handleError';
import {i18n} from 'meteor/universe:i18n';

Template.resetPassword.events({
    'submit #at-pwd-form': function (event) {
        event.preventDefault();
        const token = FlowRouter.getParam('token');
        Accounts.resetPassword(token, $('#at-field-password').val(), ( error ) =>{
            if ( error ) {
                handleError(error.reason);
            } else {
                FlowRouter.go( '/' );
                (new FlashMessage(i18n.__('FlashMessages.ok'), i18n.__('FlashMessages.passwordResetOK'), 'alert-success')).show();
            }
        });
    }
});
