import { Meteor } from 'meteor/meteor';

export class TopicFilterConfig {

    /**
     * @callback TopicFilterCallback
     * @param {string} searchQuery
     */

    /**
     * Constructor to create a config object
     * for the Topic-Filter-UI-Component.
     *
     * @param {TopicFilterCallback} callback - The callback triggered after the search query has changed
     */
    constructor(callback) {
        this.callback = callback;
    }
}

const FILTERS = [
    {text: 'Info Items', value: 'is:item is:info'},
    {text: 'Action Items', value: 'is:item is:action'},
    {text: 'Open Action Items', value: 'is:item is:action is:open'},
    {text: 'Closed Action Items', value: 'is:item is:action is:closed'},
    {text: 'Your Action Items', value: 'is:item is:action @me'}
];

const MATCH_CASE = 'do:match-case ';
const MATCH_CASE_RE = new RegExp(`${MATCH_CASE}*`,"g");

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
    tmpl.$('#cbCaseSensitiveFilter').prop("checked", caseSensitive);

    // change filters dropdown
    let matchingFilter = tmpl.find(`#filters option[value='${query}']`);
    if (matchingFilter) {
        matchingFilter.selected = true;
    } else {
        tmpl.find("#noFilter").selected = true;
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

Template.topicFilter.onCreated(function() {
});

Template.topicFilter.onRendered(function() {
    let tmpl = Template.instance();
    Meteor.setTimeout(() => { focusInputField(tmpl); }, 1);
});

Template.topicFilter.helpers({
    'filters': function () {
        return FILTERS;
    }
});

Template.topicFilter.events({
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