Router.configure({
  // set default application template for all routes
  layoutTemplate: 'appLayout'

});


Router.route('/', {name: 'home'});
Router.route('/meetingnew', {name: 'meetingnew'});
Router.route('/minutesadd/:_id', function () {
  var meetingID = this.params._id;
  var meeting = Meetings.findOne({_id: meetingID});
  this.render('minutesadd', {data: meeting});
});
Router.route('/minuteslist/:_id', function () {
  var meetingID = this.params._id;
  var meeting = Meetings.findOne({_id: meetingID});
  this.render('minuteslist', {data: meeting});
});
Router.route('/minutesshow/:_id', function () {
  var minutesID = this.params._id;
  this.render('minutesshow', {data: minutesID});
});
Router.route('/minutesedit/:_id', function () {
  var minutesID = this.params._id;
  Session.set("currentMinutesID", minutesID);
  var minute = Minutes.findOne({_id: minutesID});
  var meeting = Meetings.findOne({_id: minute.meeting_id});
  this.render('minutesedit', {data: meeting});
});
