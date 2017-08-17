import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { ItemsFilter } from '/imports/search/ItemsFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { FilterControlConfig } from '../globals/ui-controls/filterControl';
import { ITEM_KEYWORDS } from '/imports/search/FilterKeywords';

import { TopicInfoItemListContext } from '../topic/topicInfoItemList';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

import { Mongo } from 'meteor/mongo'
import { Minutes } from '/imports/minutes';

export class TabItemsConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

const FILTERS = [
    {text: 'Open Action Items', value: 'is:action is:open'},
    {text: 'Closed Action Items', value: 'is:action is:closed'},
];

Template.actionItemList.onCreated(function() {
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

Template.actionItemList.helpers({
    getTopicFilterConfig () {
        let tmpl = Template.instance();
        return new FilterControlConfig(tmpl.topicFilterHandler, FILTERS, ITEM_KEYWORDS, 'Item-Filter');
    },

    getInfoItemListContext () {
        let minutes = Minutes.find({visibleFor: {$in: [Meteor.userId()]}}).fetch();

        let myActionItems = [];
        const actionItemSeriesIdMap = {};
        minutes.forEach(minute => {
            let topics = minute.topics;
            topics.forEach(topic => {
                let actionitems = topic.infoItems.filter(item => item.itemType === 'actionItem');
                actionitems.forEach(actionitem => {
                    myActionItems.push(actionitem);
                    actionItemSeriesIdMap[actionitem._id] = minute.meetingSeries_id
                });
            });
        });

        return TopicInfoItemListContext.createdReadonlyContextForItemsOfDifferentTopicsAndDifferentMinutes(
            myActionItems,
            (itemId => {
                return actionItemSeriesIdMap[itemId];
            })
        )
    }
});