import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import {FlashMessage} from './helpers/flashMessage';
import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';

FlowRouter.route('/', {
    action() {
        Session.set('showDetailsForMinuteId', undefined);
        Session.set('showDetailsForMeetingSeriesId', undefined);
        BlazeLayout.render('appLayout', {main: 'home'});
    }
});

FlowRouter.route('/login', {
    triggersExit: [
        function () {
            FlowRouter.redirect('/');
        }
    ],
    action() {
        BlazeLayout.render('appLayout', {main: 'login'});
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
    action(params) {
        Session.set('showDetailsForMeetingSeriesId',params._id);
        BlazeLayout.render('appLayout', {main: 'meetingSeriesDetails'});
    }
});

FlowRouter.route('/minutesedit/:_id', {
    name: 'minutesedit',
    action(params) {
        Session.set('showDetailsForMinuteId',params._id);
        BlazeLayout.render('appLayout', {main: 'minutesedit'});
    }
});
