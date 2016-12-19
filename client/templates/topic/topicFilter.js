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

Template.topicFilter.onCreated(function() {
    this.callback = this.data.config.callback;
});

Template.topicFilter.helpers({

});

Template.topicFilter.events({
    'keyup #inputFilter': function(evt, tmpl) {
        evt.preventDefault();
        Template.instance().callback(tmpl.find('#inputFilter').value);
    }
});