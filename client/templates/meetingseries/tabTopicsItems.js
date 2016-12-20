import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicFilter } from '/imports/TopicFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';

import { TopicListConfig } from '../topic/topicsList';
import { ItemListConfig } from '../meetingseries/itemsList';

export class TabConfig {
    constructor (topics, parentMeetingSeriesId, isItemsView) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
        this.isItemsView = !!isItemsView;
    }
}


function getLabelIdsByName(labelName) {
    let label = Label.findLabelsStartingWithName(Template.instance().data.parentMeetingSeriesId, labelName);
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

Template.tabTopicsItems.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    this.topicFilterHandler = (query) => {
        this.topicFilterQuery.set(query);
    };
    this.topicFilter = new TopicFilter(new QueryParser(getLabelIdsByName, getUserIdByName));
    this.isItemsView = new ReactiveVar(this.data.isItemsView);
});

Template.tabTopicsItems.helpers({

    'getTopicFilterConfig': function() {
        let tmplInstance = Template.instance();

        let prependSearch = tmplInstance.data.isItemsView ? 'is:item' : '';
        return new TopicFilterConfig(tmplInstance.topicFilterHandler, prependSearch);
    },

    'topicViewData': function() {
        var query = Template.instance().topicFilterQuery.get();
        let topics = Template.instance().topicFilter.filter(this.topics, query);
        let itemsView = Template.instance().topicFilter.isItemView();
        Template.instance().isItemsView.set(itemsView);
        return (itemsView)
            ? new ItemListConfig(topics, Template.instance().data.parentMeetingSeriesId)
            : new TopicListConfig(topics, null, true, Template.instance().data.parentMeetingSeriesId);
    },

    'topicViewTemplate': function() {
        return (Template.instance().isItemsView.get()) ? 'itemsList' : 'topicsList';
    }


});
