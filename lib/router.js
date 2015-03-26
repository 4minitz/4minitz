Router.configure({
  // set default application template for all routes
  layoutTemplate: 'appLayout'

});


Router.route('/', {name: 'home'});
Router.route('/meetingnew', {name: 'meetingnew'});
Router.route('/minutesadd', {name: 'minutesadd'});
Router.route('/minuteslist', {name: 'minuteslist'});
