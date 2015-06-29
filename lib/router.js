Router.configure({
  // set default application template for all routes
  layoutTemplate: 'appLayout'

});


Router.route('/', {name: 'home'});

Router.route('/meeting/:_id', function () {
  var meetingID = this.params._id;
  this.render('meeting', {data: meetingID});
});

Router.route('/minutesadd/:_id', function () {
  var meetingID = this.params._id;
  Meteor.call("initializeMinutes", meetingID, formatDateISO8601(new Date()));

  // grab new minutes ID published by the callback inside initializeMinutes via Session
  var newMinutesID = Session.get("currentMinutesID");
  this.redirect('/minutesedit/'+newMinutesID);
});

Router.route('/minutesedit/:_id', function () {
  var minutesID = this.params._id;
  this.render('minutesedit', {data: minutesID});
});
