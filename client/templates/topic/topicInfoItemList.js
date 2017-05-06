import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import { FlashMessage } from '../../helpers/flashMessage';
import { ReactiveVar } from 'meteor/reactive-var';

const INITIAL_ITEMS_LIMIT = 4;
let _minutesId;

Template.topicInfoItemList.onCreated(function () {
    let tmplData = Template.instance().data;
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
        $('.itemPanel').sortable( "cancel" );
        onError(error)
    });
};

Template.topicInfoItemList.onRendered(function () {
    $('.itemPanel').sortable({
        appendTo: document.body,
        axis: 'y',
        opacity: 0.5,
        disabled: false,
        handle: '.itemDragDropHandle',
        update: updateItemSorting
    });
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
            currentCollapseId: parentTopicId+"_"+index  // each topic item gets its own collapseID
        };
    }
});


Template.topicElement.events({
    'click .show-more-items'(evt, tmpl) {
        evt.preventDefault();
        tmpl.isItemsLimited.set(false);
    }
});