import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicDocFilter } from '/imports/search/TopicDocFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';
import { TOPIC_KEYWORDS } from '/imports/search/FilterKeywords';

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
    this.topicFilter = new TopicDocFilter();
    this.parser = new QueryParser(
        TOPIC_KEYWORDS,
        createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
        createUserIdsReceiver
    );
});

Template.tabTopics.helpers({

    'getTopicFilterConfig': function() {
        return new TopicFilterConfig(Template.instance().topicFilterHandler);
    },

    'topicViewData': function() {
        let tmpl = Template.instance();
        let query = tmpl.topicFilterQuery.get();
        tmpl.parser.reset();
        tmpl.parser.parse(query);

        let topics = tmpl.topicFilter.filter(tmpl.data.topics, tmpl.parser);
        return new TopicListConfig(topics, null, true, tmpl.data.parentMeetingSeriesId);
    }


});
