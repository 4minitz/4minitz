import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicFilter } from '/imports/search/TopicFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';

import { TopicListConfig } from '../topic/topicsList';
import { TabItemsConfig } from './tabItems';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

export class TabTopicsConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

Template.tabTopics.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    let myTemplate = Template.instance();
    this.topicFilterHandler = (query) => {
        myTemplate.topicFilterQuery.set(query);
    };
    this.topicFilter = new TopicFilter(
        new QueryParser(createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId), createUserIdsReceiver));
});

Template.tabTopics.helpers({

    'getTopicFilterConfig': function() {
        return new TopicFilterConfig(Template.instance().topicFilterHandler);
    },

    'topicViewData': function() {
        let tmpl = Template.instance();
        var query = tmpl.topicFilterQuery.get();

        let topics = tmpl.topicFilter.filter(this.topics, query);
        return new TopicListConfig(topics, null, true, Template.instance().data.parentMeetingSeriesId);
    }


});
