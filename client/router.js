import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

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
    var meetingSeriesID = this.params._id;
    ms = new MeetingSeries(meetingSeriesID);
    ms.addNewMinutes();

    // grab new minutes ID published by the callback inside initializeMinutes via Session
    let newMinutesID = Session.get("currentMinutesID");
    this.redirect('/minutesedit/'+newMinutesID);
});

Router.route('/minutesedit/:_id', function () {
    var minutesID = this.params._id;
    this.render('minutesedit', {data: minutesID});
});
