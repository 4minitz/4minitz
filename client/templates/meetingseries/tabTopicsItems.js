import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicFilter } from '/imports/search/TopicFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';

import { TopicListConfig } from '../topic/topicsList';
import { ItemListConfig } from '../meetingseries/itemsList';

export class TabConfig {
    constructor (topics, parentMeetingSeriesId, activeTab, onSearchChanged) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
        this.activeTab = activeTab;
        this.onSearchChanged = onSearchChanged;
    }
}


function getLabelIdsByName(labelName, caseSensitive) {
    let label = Label.findLabelsContainingSubstring(Template.instance().data.parentMeetingSeriesId, labelName, caseSensitive);
    if (null !== label) {
        return label.map(label => { return label._id; });
    }
    return null;
}

function getUserIdByName(userName) {
    let user = (userName === 'me') ? Meteor.user() : Meteor.users.findOne({username: userName});
    if (user) {
        return user._id;
    }

    return userName;
}

let isItemsView = function(tmpl) {
    if (!tmpl || !tmpl.data || !tmpl.data.activeTab) { return false; }
    return tmpl.data.activeTab.get() === 'tab_items';
};

Template.tabTopicsItems.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    let myTemplate = Template.instance();
    this.topicFilterHandler = (query) => {
        myTemplate.topicFilterQuery.set(query);
        if (myTemplate.data.onSearchChanged) {
            myTemplate.data.onSearchChanged(query);
        }
    };
    this.topicFilter = new TopicFilter(new QueryParser(getLabelIdsByName, getUserIdByName));
});

Template.tabTopicsItems.helpers({

    'getTopicFilterConfig': function() {
        let tmplInstance = Template.instance();

        return new TopicFilterConfig(tmplInstance.topicFilterHandler, isItemsView(tmplInstance));
    },

    'topicViewData': function() {
        let tmpl = Template.instance();
        var query = tmpl.topicFilterQuery.get();

        let topics = tmpl.topicFilter.filter(this.topics, query);
        return (isItemsView(tmpl))
            ? new ItemListConfig(topics, Template.instance().data.parentMeetingSeriesId)
            : new TopicListConfig(topics, null, true, Template.instance().data.parentMeetingSeriesId);
    },

    'topicViewTemplate': function() {
        return (isItemsView(Template.instance())) ? 'itemsList' : 'topicsList';
    }


});
