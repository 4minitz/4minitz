import { Meteor } from 'meteor/meteor';

export class FilterControlConfig {

    /**
     * @callback FilterCallback
     * @param {string} searchQuery
     */

    /**
     * Constructor to create a config object
     * for the Topic-Filter-UI-Component.
     *
     * @param {FilterCallback} callback - The callback triggered after the search query has changed
     * @param filters
     */
    constructor(callback, filters) {
        this.callback = callback;
        this.filters = filters;
    }
}

const MATCH_CASE = 'do:match-case ';
const MATCH_CASE_RE = new RegExp(`${MATCH_CASE}*`,'g');

let toggleMatchCase = function (enable, input) {
    if (enable) {
        input.value = MATCH_CASE + input.value;
    } else {
        input.value = input.value.replace(MATCH_CASE_RE, '');
    }
};

let performSearch = function(query, tmpl) {
    tmpl.data.config.callback(query);

    if(!tmpl.view.isRendered) { return; }

    // toogle Match Case Checkbox
    let caseSensitive = (query.indexOf(MATCH_CASE.substr(0, MATCH_CASE.length-1)) !== -1);
    tmpl.$('#cbCaseSensitiveFilter').prop('checked', caseSensitive);

    // change filters dropdown
    if (tmpl.data.config.filters) {
        let matchingFilter = tmpl.find(`#filters option[value='${query}']`);
        if (matchingFilter) {
            matchingFilter.selected = true;
        } else {
            tmpl.find('#noFilter').selected = true;
        }
    }
};

let appendSpace = function(string) {
    if (string !== '') {
        string = string.trim() + ' ';
    }
    return string;
};

let focusInputField = function(tmpl) {
    if(!tmpl.view.isRendered) { return; }
    let input = tmpl.find('#inputFilter');
    input.value = appendSpace(input.value);
    input.focus();

};

Template.filterControl.onCreated(function() {
});

Template.filterControl.onRendered(function() {
    let tmpl = Template.instance();
    Meteor.setTimeout(() => { focusInputField(tmpl); }, 1);
});

Template.filterControl.helpers({
    'hasFilters': function() {
        return !!Template.instance().data.config.filters;
    },

    'filters': function () {
        return Template.instance().data.config.filters;
    }
});

Template.filterControl.events({
    'keyup #inputFilter': function(evt, tmpl) {
        evt.preventDefault();
        let query = tmpl.find('#inputFilter').value;
        performSearch(query, tmpl);
    },

    'change #cbCaseSensitiveFilter': function(evt, tmpl) {
        evt.preventDefault();
        let input = tmpl.find('#inputFilter');
        toggleMatchCase(evt.target.checked, input);
        performSearch(input.value, tmpl);
        focusInputField(tmpl);
    },

    'change #filters': function(evt, tmpl) {
        evt.preventDefault();
        let input = tmpl.find('#inputFilter');
        input.value = evt.target.value;
        toggleMatchCase(
            tmpl.find('#cbCaseSensitiveFilter').checked,
            input
        );
        performSearch(input.value, tmpl);
        focusInputField(tmpl);
    }
});