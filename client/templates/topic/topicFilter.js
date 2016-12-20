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

Template.topicFilter.onCreated(function() {
    this.callback = this.data.config.callback;
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
        Template.instance().callback(query);

        let caseSensitive = (query.indexOf(MATCH_CASE.substr(0, MATCH_CASE.length-1)) !== -1);
        tmpl.$('#cbCaseSensitiveFilter').prop("checked", caseSensitive);
    },

    'change #cbCaseSensitiveFilter': function(evt, tmpl) {
        evt.preventDefault();
        let input = tmpl.find('#inputFilter');
        toggleMatchCase(evt.target.checked, input);
        Template.instance().callback(input.value);
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
        Template.instance().callback(input.value);
        input.focus();
    }
});