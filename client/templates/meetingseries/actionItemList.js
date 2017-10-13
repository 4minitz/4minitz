import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { ItemsFilter } from '/imports/search/ItemsFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { FilterControlConfig } from '../globals/ui-controls/filterControl';
import { ITEM_KEYWORDS } from '/imports/search/FilterKeywords';

import { TopicInfoItemListContext } from '../topic/topicInfoItemList';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

import { MeetingSeries } from '/imports/meetingseries';
import { Meteor } from 'meteor/meteor';
import { TopicSchema } from '/imports/collections/topic.schema';

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

    let meetingSeriesIDs = MeetingSeries.find().map(function(item){ return item._id; });
    this.subscribe('topics', meetingSeriesIDs);
});

Template.actionItemList.helpers({
    getTopicFilterConfig () {
        let tmpl = Template.instance();
        return new FilterControlConfig(tmpl.topicFilterHandler, FILTERS, ITEM_KEYWORDS, 'Item-Filter', 'is:action is:open');
    },

    getInfoItemListContext () {
        let myActionItems = [];
        const actionItemSeriesIdMap = {};

        let topics = TopicSchema.getCollection().find().fetch();
        topics.forEach(topic => {
            let actionItems = topic.infoItems.filter(item => item.itemType === 'actionItem' && item.responsibles.includes(Meteor.userId()));
            actionItems.forEach(actionItem => {
                myActionItems.push(actionItem);
                actionItemSeriesIdMap[actionItem._id] = topic.parentId;
            });
        });

        const tmpl = Template.instance();
        const query = tmpl.topicFilterQuery.get();
        tmpl.parser.reset();
        tmpl.parser.parse(query);

        myActionItems = tmpl.itemsFilter.filter(myActionItems, tmpl.parser);

        myActionItems.sort(function(a, b){return new Date(a.duedate)- new Date(b.duedate);});

        return TopicInfoItemListContext.createdReadonlyContextForItemsOfDifferentTopicsAndDifferentMinutes(
            myActionItems,
            (itemId => {
                return actionItemSeriesIdMap[itemId];
            })
        );
    }
});