import { ReactiveVar } from 'meteor/reactive-var';

import { ItemsFilter } from '/imports/search/ItemsFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { FilterControlConfig } from '../globals/ui-controls/filterControl';
import { ITEM_KEYWORDS } from '/imports/search/FilterKeywords';

import { TopicInfoItemListContext } from '../topic/topicInfoItemList';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

export class TabItemsConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

const FILTERS = [
    {text: 'Info Items', value: 'is:info'},
    {text: 'Action Items', value: 'is:action'},
    {text: 'Open Action Items', value: 'is:action is:open'},
    {text: 'Closed Action Items', value: 'is:action is:closed'},
    {text: 'Your Action Items', value: 'is:action @me'}
];

Template.tabItems.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar('');
    let myTemplate = Template.instance();
    this.topicFilterHandler = (query) => {
        myTemplate.topicFilterQuery.set(query);
    };

    this.itemsFilter = new ItemsFilter();
    this.parser = new QueryParser(
        ITEM_KEYWORDS,
        createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
        createUserIdsReceiver
    );
});

Template.tabItems.helpers({

    getTopicFilterConfig () {
        let tmpl = Template.instance();
        return new FilterControlConfig(tmpl.topicFilterHandler, FILTERS);
    },

    getInfoItemListContext () {
        const tmpl = Template.instance();

        const query = tmpl.topicFilterQuery.get();
        tmpl.parser.reset();
        tmpl.parser.parse(query);

        const items = tmpl.data.topics.reduce(
            (acc, topic) => {
                return acc.concat(topic.infoItems.map((item) => {
                    item.parentTopicId = topic._id;
                    return item;
                }));
            },
            /* initial value */
            []
        );

        return TopicInfoItemListContext.createReadonlyContextForItemsOfDifferentTopics(
            tmpl.itemsFilter.filter(items, tmpl.parser),
            tmpl.data.parentMeetingSeriesId
        )
    }

});
