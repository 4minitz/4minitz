import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import {FlashMessage} from './helpers/flashMessage';
import { Accounts } from 'meteor/accounts-base';

// reset document title on route exit
// To set a route specific title use a helper in the according template
const resetDocumentTitle = function () {
    document.title = '4Minitz!';
};

FlowRouter.route('/', {
    action() {
        BlazeLayout.render('appLayout', {main: 'home'});
    }
});


FlowRouter.route('/admin', {
    name: 'admin',
    action() {
        BlazeLayout.render('appLayout', {main: 'admin'});
    }
});

FlowRouter.route('/legalnotice', {
    name: 'legalNotice',
    action() {
        BlazeLayout.render('legalNotice');
    }
});


FlowRouter.route( '/verify-email/:token', {
    name: 'verify-email',
    action( params ) {
        Accounts.verifyEmail( params.token, ( error ) =>{
            if ( error ) {
                (new FlashMessage('Error', error.reason)).show();
            } else {
                FlowRouter.go( '/' );
                (new FlashMessage('', 'Email verified', 'alert-success')).show();
            }
        });
    }
});

FlowRouter.route( '/reset-password/:token', {
    name: 'reset-password',
    action() {
        BlazeLayout.render('resetPassword');
    }
});


FlowRouter.route('/meetingseries/:_id', {
    name: 'meetingseries',
    action() {
        BlazeLayout.render('appLayout', {main: 'meetingSeriesDetails'});
    }
});

FlowRouter.route('/minutesedit/:_id', {
    name: 'minutesedit',
    action() {
        BlazeLayout.render('appLayout', {main: 'minutesedit'});
    },
    triggersExit: [resetDocumentTitle]
});


FlowRouter.route('/topic/:_id', {
    name: 'topic',
    action() {
        BlazeLayout.render('appLayout', {main: 'topicViewOne'});
    }
});
