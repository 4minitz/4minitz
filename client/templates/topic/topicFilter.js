import { Meteor } from 'meteor/meteor';

Template.topicFilter.onCreated(function() {
});

Template.topicFilter.helpers({

});

Template.topicFilter.events({
    'change #inputFilter': function(evt, tmpl) {
        evt.preventDefault();
        this.handler.filterTopics(tmpl.find('#inputFilter').value);
    }
});