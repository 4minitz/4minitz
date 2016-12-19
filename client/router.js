import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries';
import { Minutes } from '/imports/minutes';
import { UserRoles } from '/imports/userroles';

import { FlashMessage } from '/client/helpers/flashMessage';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.triggers.enter([function () {
    if (!Meteor.userId()) {
        FlowRouter.redirect('/login');
    }
}]);

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

FlowRouter.route('/meetingseries/:_id', {
    action() {
        BlazeLayout.render('appLayout', {main: 'meetingSeriesDetails'});
    }
});

// todo: get rid of this
// this should not be handled within a route
FlowRouter.route('/minutesadd/:_id', {
    action(params) {
        let meetingSeriesID = params._id;

        let usrRoles = new UserRoles();
        if (!usrRoles.hasViewRoleFor(meetingSeriesID)) {
            FlowRouter.go("/");
        }

        let id;
        ms = new MeetingSeries(meetingSeriesID);
        ms.addNewMinutes(
            // optimistic ui callback
            newMinutesID => {
                id = newMinutesID
            },

            // server callback
            (error/*, newMinutesID*/) => {
                // no need to redirect to correct minutes page
                // as the optimistic ui callback already took
                // care of that

                if (error) {
                    // display error
                    Session.set("errorTitle", error.error);
                    Session.set("errorReason", error.reason);
                    FlowRouter.redirect('/meetingseries/' + meetingSeriesID);
                }
            }
        );

        // callback should have been called by now
        if (id) {
            FlowRouter.redirect('/minutesedit/' + id);
        } else {
            // todo: use error page
            FlowRouter.redirect('/meetingseries/' + meetingSeriesID);
        }
    }
});


FlowRouter.route('/minutesedit/:_id', {
    action() {
        BlazeLayout.render('appLayout', {main: 'minutesedit'});
    }
});
