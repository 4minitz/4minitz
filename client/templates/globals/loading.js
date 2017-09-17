import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

Template.loading.onRendered(function() {
    $('#loading-content').hide().delay(500).fadeIn('slow');
});
