import { Meteor } from 'meteor/meteor';

if (Meteor.settings.isEnd2EndTest) {
    require('/client/debug/findEventHandlers');
}

// initialize
//  * twitter bootstrap
//  * bootstrape-datetimepicker
//  * bootstrap-material-design

// with arrive we need exactly one $.material.init()
import 'arrive';

// required by bootstrap-datetimepicker
import 'moment/moment';

// bootstrap js
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/js/transition';
import 'bootstrap/js/collapse'

// bootstrap datetime picker
import 'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';

// material design
import 'bootstrap-material-design';
import 'bootstrap-material-design/dist/js/material';
import 'bootstrap-material-design/dist/js/ripples';

// as soon as the document is loaded initialize material design
$(document).ready(() => {
    $.material.init();
});