Router.configure({
  // set default application template for all routes
  layoutTemplate: 'appLayout'

});


Router.route('/', {name: 'home'});
Router.route('/meetingnew', {name: 'meetingnew'});

Router.route('/minuteslist/:_id', function () {
  var meetingID = this.params._id;
  var meeting = Meetings.findOne({_id: meetingID});
  this.render('minuteslist', {data: meeting});
});

Router.route('/minutesadd/:_id', function () {
  var meetingID = this.params._id;
  Meteor.call("initializeMinutes", meetingID, formatDateISO8601(new Date()));
  var newMinutesID = Session.get("currentMinutesID");

  this.redirect('/minutesedit/'+newMinutesID);
});

Router.route('/minutesedit/:_id', function () {
  var minutesID = this.params._id;
  this.render('minutesedit', {data: minutesID});
});

Router.route('/minutesshow/:_id', function () {
  var minutesID = this.params._id;
  this.render('minutesshow', {data: minutesID});
});

