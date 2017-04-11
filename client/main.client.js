import { Meteor } from 'meteor/meteor';
import { bootstrapAttachementsLiveQuery } from '/imports/collections/attachments_private'

// initialize
//  * twitter bootstrap
//  * bootstrap-datetimepicker
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
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css';
import 'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';

// material design
import 'bootstrap-material-design';
import 'bootstrap-material-design/dist/js/material';
import 'bootstrap-material-design/dist/js/ripples';

// jquery ui - use the download builder to select packages to load
// https://jqueryui.com/download/#!version=1.12.0&components=000000000000000000000000000000000000000000000000
// currently used:
//   * sortable (plus dependencies)
import 'jquery-ui/ui/widget';
import 'jquery-ui/ui/data';
import 'jquery-ui/ui/scroll-parent';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/sortable';

import 'jquery-ui-touch-punch/jquery.ui.touch-punch';

$(document).arrive('input', {
    onceOnly: false
}, function () {
    let invalidMsg = $(this).attr('data-error-msg');
    if(invalidMsg) {
        $(this).on('invalid', function() {
            this.setCustomValidity(invalidMsg);
        });
        $(this).on('input', function() {
            this.setCustomValidity('');
        });
    }
});

// as soon as the document is loaded initialize material design
$(document).ready(() => {
    $.material.init();
});

Meteor.startup(() => {
    Meteor.call("gitVersionInfoUpdate");

    bootstrapAttachementsLiveQuery();

    // Make sure that all server side markdown rendering quotes all HTML <TAGs>
    Markdown.setOptions({
        sanitize: true
    });

    Template.registerHelper("pathForImproved", function(path) {
        // FlowRouters pathFor helper is a little bit inconsistent.
        // for ROOT_URL=http://localhost:3000           it processes "/" => "/"
        // for ROOT_URL=http://localhost:3100/4minitz   it processes "/" => "/4minitz"
        // so sometimes we have a trailing "/" sometimes not.
        // Unfortunately serving an image like so "<img src="//mylogo.png"> does not work!
        let pathWithTrailingSlash = Blaze._globalHelpers.pathFor(path);
        if (! pathWithTrailingSlash.endsWith("/")) {
            pathWithTrailingSlash = pathWithTrailingSlash + "/";
        }
        return pathWithTrailingSlash;
    });
});
