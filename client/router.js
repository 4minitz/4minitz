import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
    action() {
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
    }
});
