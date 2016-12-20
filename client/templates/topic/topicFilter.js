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
     * @param {string} initialSearchQuery - The string which should be initially set as search query
     */
    constructor(callback, initialSearchQuery) {
        this.callback = callback;
        this.prependSearch = initialSearchQuery;
    }
}

const FILTERS = [
    {text: 'Info Items', value: 'is:info'},
    {text: 'Action Items', value: 'is:action'},
    {text: 'Open Action Items', value: 'is:open'},
    {text: 'Closed Action Items', value: 'is:closed'},
    {text: 'Your Action Items', value: '@me'},
];

const MATCH_CASE = 'do:match-case ';

let toggleMatchCase = function (enable, input) {
    if (enable) {
        input.value = MATCH_CASE + input.value;
    } else {
        let MatchCaseRE = new RegExp(MATCH_CASE+"*","g");
        input.value = input.value.replace(MatchCaseRE, '');
    }
};

let performSearch = function(query) {
    Template.instance().data.config.callback(query);
};

Template.topicFilter.onCreated(function() {
});

Template.topicFilter.helpers({
    'filters': function () {
        return FILTERS;
    },

    'searchDefaultValue': function () {
        let query = Template.instance().data.config.prependSearch;
        performSearch(query);
        return query;
    }
});

Template.topicFilter.events({
    'keyup #inputFilter': function(evt, tmpl) {
        evt.preventDefault();
        let query = tmpl.find('#inputFilter').value;
        performSearch(query);

        let caseSensitive = (query.indexOf(MATCH_CASE.substr(0, MATCH_CASE.length-1)) !== -1);
        tmpl.$('#cbCaseSensitiveFilter').prop("checked", caseSensitive);
    },

    'change #cbCaseSensitiveFilter': function(evt, tmpl) {
        evt.preventDefault();
        let input = tmpl.find('#inputFilter');
        toggleMatchCase(evt.target.checked, input);
        performSearch(input.value);
        input.focus();
    },

    'change #filters': function(evt, tmpl) {
        evt.preventDefault();
        let input = tmpl.find('#inputFilter');
        tmpl.find('#inputFilter').value = evt.target.value;
        toggleMatchCase(
            tmpl.find('#cbCaseSensitiveFilter').checked,
            input
        );
        performSearch(input.value);
        input.focus();
    }
});