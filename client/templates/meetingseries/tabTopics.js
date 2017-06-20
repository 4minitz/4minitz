import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { TopicsFilter } from '/imports/search/TopicsFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { FilterControlConfig } from '../globals/ui-controls/filterControl';
import { TOPIC_KEYWORDS } from '/imports/search/FilterKeywords';

import { TopicListConfig } from '../topic/topicsList';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

export class TabTopicsConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

const FILTERS = [
    {text: 'Open Topics', value: 'is:open'},
    {text: 'Closed Topics', value: 'is:closed'},
    {text: 'Your Topics', value: '@me'}
];

Template.tabTopics.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar('');
    let myTemplate = Template.instance();
    this.topicFilterHandler = (query) => {
        myTemplate.topicFilterQuery.set(query);
    };
    this.topicFilter = new TopicsFilter();
    this.parser = new QueryParser(
        TOPIC_KEYWORDS,
        createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
        createUserIdsReceiver
    );
});

Template.tabTopics.helpers({

    'getTopicFilterConfig': function() {
        return new FilterControlConfig(Template.instance().topicFilterHandler, FILTERS);
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
