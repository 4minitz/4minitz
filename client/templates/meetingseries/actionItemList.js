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
        let meetingSeries = MeetingSeries.find({visibleFor: {$in: [Meteor.userId()]}}).fetch();

        let myActionItems = [];
        const actionItemSeriesIdMap = {};

        meetingSeries.forEach(meetingSerie => {
            let topics = meetingSerie.topics;
            topics.forEach(topic => {
                let actionItems = topic.infoItems.filter(item => item.itemType === 'actionItem' && item.responsibles.includes(Meteor.userId()));
                actionItems.forEach(actionItem => {
                    myActionItems.push(actionItem);
                    actionItemSeriesIdMap[actionItem._id] = meetingSerie._id;
                })
            })
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