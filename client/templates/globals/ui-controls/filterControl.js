import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { ConfirmationDialogFactory } from "../../../helpers/confirmationDialogFactory";

export class FilterControlConfig {
  /**
   * @callback FilterCallback
   * @param {string} searchQuery
   */

  /**
   * Constructor to create a config object
   * for the Topic-Filter-UI-Component.
   *
   * @param {FilterCallback} callback - The callback triggered after the search
   *     query has changed
   * @param filters
   * @param filterKeywords
   * @param filterName
   * @param defaultFilter
   */
  constructor(callback, filters, filterKeywords, filterName, defaultFilter) {
    this.callback = callback;
    this.filters = filters;
    this.filterKeywords = filterKeywords;
    this.filterName = filterName;
    this.defaultFilter = defaultFilter;
  }
}

const MATCH_CASE = "do:match-case ";
const MATCH_CASE_RE = new RegExp(`${MATCH_CASE}*`, "g");

const toggleMatchCase = (enable, input) => {
  input.value = enable
    ? MATCH_CASE + input.value
    : input.value.replace(MATCH_CASE_RE, "");
};

const performSearch = (query, tmpl) => {
  tmpl.data.config.callback(query);

  if (!tmpl.view.isRendered) {
    return;
  }

  // toogle Match Case Checkbox
  const caseSensitive =
    query.indexOf(MATCH_CASE.substr(0, MATCH_CASE.length - 1)) !== -1;
  tmpl.$("#cbCaseSensitiveFilter").prop("checked", caseSensitive);

  // change filters dropdown
  if (tmpl.data.config.filters) {
    const matchingFilter = tmpl.find(`#filters option[value='${query}']`);
    if (matchingFilter) {
      matchingFilter.selected = true;
    } else {
      tmpl.find("#noFilter").selected = true;
    }
  }
};

const appendSpace = (string) => {
  if (string !== "") {
    return `${string.trim()} `;
  }
  return string;
};

const focusInputField = (tmpl) => {
  if (!tmpl.view.isRendered) {
    return;
  }
  const input = tmpl.find("#inputFilter");
  input.value = appendSpace(input.value);
  input.focus();
};

Template.filterControl.onCreated(() => {});

Template.filterControl.onRendered(() => {
  const tmpl = Template.instance();
  Meteor.setTimeout(() => {
    focusInputField(tmpl);
  }, 1);

  if (tmpl.data.config.defaultFilter)
    performSearch(tmpl.data.config.defaultFilter, tmpl);
});

Template.filterControl.helpers({
  hasFilters() {
    return Boolean(Template.instance().data.config.filters);
  },

  filters() {
    return Template.instance().data.config.filters;
  },
});

Template.filterControl.events({
  "keyup #inputFilter": function (evt, tmpl) {
    evt.preventDefault();
    const query = tmpl.find("#inputFilter").value;
    performSearch(query, tmpl);
  },

  "change #cbCaseSensitiveFilter": function (evt, tmpl) {
    evt.preventDefault();
    const input = tmpl.find("#inputFilter");
    toggleMatchCase(evt.target.checked, input);
    performSearch(input.value, tmpl);
    focusInputField(tmpl);
  },

  "change #filters": function (evt, tmpl) {
    evt.preventDefault();
    const input = tmpl.find("#inputFilter");
    input.value = evt.target.value;
    toggleMatchCase(tmpl.find("#cbCaseSensitiveFilter").checked, input);
    performSearch(input.value, tmpl);
    focusInputField(tmpl);
  },

  "click #filter-usage": function (evt, tmpl) {
    evt.preventDefault();
    const keywords = tmpl.data.config.filterKeywords;
    const keywordArray = Object.keys(keywords)
      .filter((key) => typeof keywords[key] !== "function")
      .map((key) => {
        const object = keywords[key];
        if (object.values === "*") {
          object.values = "any text";
        }
        return object;
      });
    ConfirmationDialogFactory.makeInfoDialog(
      `Usage for ${tmpl.data.config.filterName}`,
    )
      .setTemplate("filterUsage", {
        keywords: keywordArray,
      })
      .show();
  },
});
