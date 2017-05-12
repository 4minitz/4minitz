import { Topic } from '/imports/topic';
import { ReactiveVar } from 'meteor/reactive-var';

const INITIAL_ITEMS_LIMIT = 4;
let _minutesId;

Template.topicInfoItemList.onCreated(function () {
    let tmplData = this.data;
    this.infoItems = new ReactiveVar([]);
    _minutesId = tmplData.minutesID;
    this.isItemsLimited = new ReactiveVar(tmplData.topic.infoItems.length > INITIAL_ITEMS_LIMIT);
});

let updateItemSorting = (evt, ui) => {
    let item = ui.item,
        sorting = item.parent().find('> .topicInfoItem'),
        topic = new Topic(_minutesId, item.attr('data-parent-id')),
        newItemSorting = [];

    for (let i = 0; i < sorting.length; ++i) {
        let itemId = $(sorting[i]).attr('data-id');
        let item = topic.findInfoItem(itemId);

        newItemSorting.push(item.getDocument());
    }

    topic.setItems(newItemSorting);
    topic.save().catch(error => {
        $('.itemPanel').sortable( 'cancel' );
        onError(error);
    });
};

function initializeDragAndDrop(tmpl) {
    tmpl.$('.itemPanel').sortable({
        appendTo: document.body,
        axis: 'y',
        opacity: 0.5,
        disabled: false,
        handle: '.itemDragDropHandle',
        update: updateItemSorting
    });
}

function asyncItemsPush(reactiveVar, currentItemCount, allItems, topicId) {
    reactiveVar.set([...allItems.slice(0, currentItemCount)]);
    currentItemCount++;

    if (currentItemCount >= allItems.length) {
        console.log(`topic ${topicId} finished`);
        return;
    }

    Meteor.setTimeout(() => {
        asyncItemsPush(reactiveVar, currentItemCount, allItems, topicId);
    }, 50);
}

Template.topicInfoItemList.onRendered(function () {
    if (Template.instance().data.isEditable) {
        initializeDragAndDrop(this);
    }

    let tmpl = Template.instance();
    let topic = tmpl.data.topic;
    asyncItemsPush(tmpl.infoItems, 1, topic.infoItems, topic._id);
});

Template.topicInfoItemList.helpers({
    getItems: function() {
        let tmpl = Template.instance();
        if (tmpl.isItemsLimited.get()) {
            return tmpl.data.topic.infoItems.slice(0, INITIAL_ITEMS_LIMIT);
        } else {
            return tmpl.data.topic.infoItems;
        }
    },

    showMoreButton: function() {
        let tmpl = Template.instance();
        return tmpl.isItemsLimited.get();
    },

    infoItems() {
        let tmpl = Template.instance();
        return tmpl.infoItems.get();
    },

    // helper will be called within the each-infoItem block
    // so this refers to the current infoItem
    getInfoItem: function (index) {
        let parentTopicId = Template.instance().data.topic._id;
        let parentElement = (Template.instance().data.minutesID)
            ? Template.instance().data.minutesID : Template.instance().data.parentMeetingSeriesId;

        return {
            infoItem: this,
            parentTopicId: parentTopicId,
            isEditable: Template.instance().data.isEditable,
            minutesID: parentElement,
            currentCollapseId: parentTopicId+'_'+index  // each topic item gets its own collapseID
        };
    }
});


Template.topicElement.events({
    'click .show-more-items'(evt, tmpl) {
        evt.preventDefault();
        tmpl.isItemsLimited.set(false);
    }
});