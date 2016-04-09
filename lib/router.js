Router.configure({
  // set default application template for all routes
  layoutTemplate: 'appLayout'

});


Router.route('/', {name: 'home'});

Router.route('/meetingseries/:_id', function () {
  var meetingSeriesID = this.params._id;
  this.render('meetingSeries', {data: meetingSeriesID});
});

Router.route('/minutesadd/:_id', function () {
  var meetingSeriesID = this.params._id;
  Meteor.call("addMinutes", meetingSeriesID, formatDateISO8601(new Date()));

  // grab new minutes ID published by the callback inside initializeMinutes via Session
  var newMinutesID = Session.get("currentMinutesID");
  this.redirect('/minutesedit/'+newMinutesID);
});

Router.route('/minutesedit/:_id', function () {
  var minutesID = this.params._id;
  this.render('minutesedit', {data: minutesID});
});
