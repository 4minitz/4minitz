import { MeetingSeries } from '/imports/meetingseries'

Router.configure({
    // set default application template for all routes
    layoutTemplate: 'appLayout'
});


Router.route('/', {name: 'home'});

Router.route('/meetingseries/:_id', function () {
    var meetingSeriesID = this.params._id;
    this.render('meetingSeriesDetails', {data: meetingSeriesID});
});

Router.route('/minutesadd/:_id', function () {
    let meetingSeriesID = this.params._id;
    ms = new MeetingSeries(meetingSeriesID);

    let id;
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
                // todo: display error
                this.redirect('/meetingseries/' + meetingSeriesID);
            }
        }
    );

    // callback should have been called by now
    if (id) {
        this.redirect('/minutesedit/' + id);
    } else {
        // todo: use error page
        this.redirect('/meetingseries/' + meetingSeriesID);
    }
});

Router.route('/minutesedit/:_id', function () {
    var minutesID = this.params._id;
    this.render('minutesedit', {data: minutesID});
});
