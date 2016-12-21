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
     * @param {boolean} switchToItemsView - Switches between items and topics tab
     */
    constructor(callback, switchToItemsView) {
        this.callback = callback;
        this.switchToItemsView = switchToItemsView;
    }
}

const FILTERS = [
    {text: 'Info Items', value: 'is:item is:info'},
    {text: 'Action Items', value: 'is:item is:action'},
    {text: 'Open Action Items', value: 'is:item is:open'},
    {text: 'Closed Action Items', value: 'is:item is:closed'},
    {text: 'Your Action Items', value: 'is:item @me'}
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

    // switch active tab
    let activeTab = 'tab_topics';
    if (query.indexOf('is:item') !== -1) {
        activeTab = 'tab_items';

        tmpl.data.config.switchToItemsView = true;
    } else {
        tmpl.data.config.switchToItemsView = false;
    }
    Session.set('activeTabId', activeTab);

    // change filters dropdown
    let matchingFilter = tmpl.find(`#filters option[value='${query}']`);
    if (matchingFilter) {
        matchingFilter.selected = true;
    } else {
        tmpl.find("#noFilter").selected = true;
    }
};

Template.topicFilter.onCreated(function() {
});

Template.topicFilter.helpers({
    'filters': function () {
        return FILTERS;
    },

    'injectFilterValue': function () {
        const IS_ITEM = 'is:item';
        let tmpl = Template.instance();
        let query;
        let currentQuery = (tmpl.view.isRendered) ? tmpl.find('#inputFilter').value : '';
        if (tmpl.data.config.switchToItemsView) {
            let prependedQuery = (currentQuery) ? `${IS_ITEM} ${currentQuery}` : IS_ITEM;
            query = (currentQuery.indexOf(IS_ITEM) === -1) ? prependedQuery : currentQuery;
        } else {
            query = currentQuery.replace(new RegExp(`${IS_ITEM}*`, 'g'), '');
        }
        query = query.trim();
        performSearch(query, tmpl);
        return query;
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
        performSearch(input.value, tmpl);
        input.focus();
    }
});