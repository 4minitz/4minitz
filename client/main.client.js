import "/imports/config/accounts";
// initialize
//  * twitter bootstrap
//  * bootstrap-datetimepicker
//  * bootstrap-material-design

// with arrive we need exactly one $.material.init()
import "arrive";
// required by bootstrap-datetimepicker
import "moment/moment";
// bootstrap js
import "bootstrap/dist/js/bootstrap";
import "bootstrap/js/transition";
import "bootstrap/js/collapse";
// bootstrap datetime picker
import
    "eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css";
import
    "eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min";
// material design
import "bootstrap-material-design";
import "bootstrap-material-design/dist/js/material";
import "bootstrap-material-design/dist/js/ripples";
// jquery ui - use the download builder to select packages to load
// https://jqueryui.com/download/#!version=1.12.0&components=000000000000000000000000000000000000000000000000
// currently used:
//   * sortable (plus dependencies)
import "jquery-ui/ui/widget";
import "jquery-ui/ui/data";
import "jquery-ui/ui/scroll-parent";
import "jquery-ui/ui/widgets/mouse";
import "jquery-ui/ui/widgets/sortable";

import {I18nHelper} from "/imports/helpers/i18n";
import {Blaze} from "meteor/blaze";
import {Astro} from "meteor/jagi:astronomy";
import {$} from "meteor/jquery";
import {Meteor} from "meteor/meteor";
import {Markdown} from "meteor/perak:markdown";
import {Template} from "meteor/templating";

$(document).arrive(
    "input",
    {
      onceOnly : false,
    },
    function() {
      const invalidMsg = $(this).attr("data-error-msg");
      if (invalidMsg) {
        $(this).on("invalid",
                   function() { this.setCustomValidity(invalidMsg); });
        $(this).on("input", function() { this.setCustomValidity(""); });
      }
    },
);

$(document).arrive(".clear-on-escape", function() {
  $(this).keydown((event) => {
    if (event.which === 27 /*ESC*/) {
      $(this).val("");
    }
  });
});

// as soon as the document is loaded initialize material design
$(document).ready(() => {
  $.material.checkboxOriginal = $.material.checkbox;
  $.material.checkbox = function(selector) {
    const $input = $(selector ? selector : this.options.checkboxElements);
    if (!$input.next() || !$input.next().hasClass("checkbox-material")) {
      this.checkboxOriginal(selector);
    }
  };
  $.material.init();
});

// remove the modal dialog completely on route changes
window.onpopstate = () => {
  $(".modal-backdrop").remove();
  $(".modal").hide();
};

Meteor.startup(async () => {
  Meteor.call("gitVersionInfoUpdate");

  // Make sure that all server side markdown rendering quotes all HTML <TAGs>
  Markdown.setOptions({
    sanitize : true,
  });
  Astro.config.logs.nonExistingField =
      false; // Turn off warnings about non existing fields.

  Template.registerHelper("pathForImproved", (path) => {
    // FlowRouters pathFor helper is a little bit inconsistent.
    // for ROOT_URL=http://localhost:3000           it processes "/" => "/"
    // for ROOT_URL=http://localhost:3100/4minitz   it processes "/" =>
    // "/4minitz" so sometimes we have a trailing "/" sometimes not.
    // Unfortunately serving an image like so "<img src="//mylogo.png"> does not
    // work!
    const pathWithTrailingSlash = Blaze._globalHelpers.pathFor(path);
    if (!pathWithTrailingSlash.endsWith("/")) {
      return `${pathWithTrailingSlash}/`;
    }
    return pathWithTrailingSlash;
  });

  await I18nHelper.setLanguageLocale();
});

// IF we lost connection to server
// AND (user wants to leave the current URL OR user wants to close the tab OR
// attempts to Reload page)
// => we show a standard browsers warning message
window.addEventListener("beforeunload", (e) => {
  if (Meteor.status().connected || Meteor.settings.public.isEnd2EndTest) {
    // OK, continue with unload
    delete e.returnvalue;
    return;
  }

  // Cancel the unload event and show browsers "Yes/No" confirmation box
  e.preventDefault();
  e.returnValue = ""; // Chrome requires returnValue to be set
  return "?";         // Older browsers need string to be returned
});
