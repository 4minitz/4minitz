import { Topic } from '/imports/topic';
import { InfoItem } from '/imports/infoitem';
import { ActionItem } from '/imports/actionitem';
import { Minutes } from '/imports/minutes';
import { ReactiveVar } from 'meteor/reactive-var';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import {InfoItemFactory} from "../../../imports/InfoItemFactory";

const INITIAL_ITEMS_LIMIT = 4;
let _minutesId;

Template.topicInfoItemList.onCreated(function () {
    let tmplData = Template.instance().data;
    _minutesId = tmplData.minutesID;
    this.isItemsLimited = new ReactiveVar(tmplData.topic.infoItems.length > INITIAL_ITEMS_LIMIT);
    this.isItemCollapsed = new ReactiveVar(tmplData.topic.infoItems.map(v => true));
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

let getMeetingSeriesId = (parentElementId) => {
    let aMin = Minutes.findOne(parentElementId);
    if (aMin) {
        return aMin.parentMeetingSeriesID();
    } else {
        return parentElementId;
    }
};

let createTopic = (parentElementId, topicId) => {
    if (!parentElementId || !topicId) return undefined;
    return new Topic(parentElementId, topicId);
};

let findInfoItem = (parentElementId, topicId, infoItemId) => {
    let aTopic = createTopic(parentElementId, topicId);
    if (aTopic) {
        return aTopic.findInfoItem(infoItemId);
    }
    return undefined;
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

function getDetails(topic, infoItemIndex) {
    return topic.infoItems[infoItemIndex].details || [];
}

Template.topicInfoItemList.onRendered(function () {
    if (Template.instance().data.isEditable) {
        initializeDragAndDrop(this);
    }
});

let addNewDetails = async (tmpl, index) => {
    let aMin = new Minutes(tmpl.data.minutesID);
    let aTopic = new Topic(aMin, tmpl.data.topic._id);
    let infoItem = tmpl.data.topic.infoItems[index];
    let aItem = InfoItemFactory.createInfoItem(aTopic, infoItem._id);

    let detailsRootElement = tmpl.$(`#id-details-${infoItem._id}`);
    detailsRootElement.parent().collapse('show');

    aItem.addDetails(aMin._id);
    await  aItem.save();

    // Defer opening new details editor to give DOM some time for its expand animation
    Meteor.setTimeout(function () {
        let inputEl = detailsRootElement.find('.detailInput').last().show();
        detailsRootElement.find('.detailActions').last().show();
        inputEl.parent().css('margin', '0 0 25px 0');
        inputEl.show();
        inputEl.focus();
    }, 250);
};

let resizeTextarea = (element) => {
    let scrollPos = $(document).scrollTop();
    element.css('height', 'auto');
    element.css('height', element.prop('scrollHeight') + 'px');
    $(document).scrollTop(scrollPos);
};

Template.topicInfoItemList.helpers({
    triggerAddDetails: function(index) {
        let itemId = Session.get('topicInfoItem.triggerAddDetailsForItem');
        if (itemId && itemId === this.topic.infoItems[index]._id) {
            Session.set('topicInfoItem.triggerAddDetailsForItem', null);
            let tmpl = Template.instance();
            Meteor.setTimeout(() => {
                addNewDetails(tmpl, index);
            }, 1300); // we need this delay otherwise the input field will be made hidden immediately
        }
        // do not return anything! This will be rendered on the page!
        return '';
    },

    topicStateClass: function (index) {
        let infoItem = this.topic.infoItems[index];
        if (infoItem.itemType !== 'actionItem') {
            return 'infoitem';
        } else if (infoItem.isOpen) {
            return 'actionitem-open';
        } else {
            return 'actionitem-closed';
        }
    },

    hasDetails: function (index) {
        let details = getDetails(this.topic, index);
        return details.length > 0;
    },

    detailsArray: function (index) {
        return getDetails(this.topic, index);
    },

    isCollapsed(index) {
        let allItemsCollapseState = Template.instance().isItemCollapsed.get();
        return allItemsCollapseState[index];
    },

    isActionItem: function(index) {
        return (this.topic.infoItems[index].itemType === 'actionItem');
    },

    isInfoItem: function(index) {
        return (this.topic.infoItems[index].itemType === 'infoItem');
    },

    checkedState: function (index) {
        let infoItem = this.topic.infoItems[index];
        if (infoItem.itemType === 'infoItem' || infoItem.isOpen) {
            return '';
        } else {
            return {checked: 'checked'};
        }
    },

    disabledState: function () {
        if (this.isEditable) {
            return '';
        } else {
            return {disabled: 'disabled'};
        }
    },

    idForEdit() {
        return this.isEditable ? 'btnEditInfoItem' : '';
    },

    responsiblesHelper(index) {
        let parentElement = (this.minutesID) ? this.minutesID : this.parentMeetingSeriesId;
        let aInfoItem = findInfoItem(parentElement, this.topic._id, this.topic.infoItems[index]._id);
        if (aInfoItem instanceof ActionItem) {
            if (aInfoItem.hasResponsibles()) {
                return '(' + aInfoItem.getResponsibleNameString() + ')';
            }
        }
        return '';
    },

    getLabels: function(index) {
        let parentElement = (this.minutesID) ? this.minutesID : this.parentMeetingSeriesId;
        let aInfoItem = findInfoItem(parentElement, this.topic._id, this.topic.infoItems[index]._id);
        if (!aInfoItem) {
            return;
        }
        return aInfoItem.getLabels(getMeetingSeriesId(this.minutesID))
            .map(labelObj => {
                let doc = labelObj.getDocument();
                doc.fontColor = labelObj.hasDarkBackground() ? '#ffffff' : '#000000';

                return doc;
            });
    }
});


Template.topicInfoItemList.events({
    'click .show-more-items'(evt, tmpl) {
        evt.preventDefault();
        tmpl.isItemsLimited.set(false);
    },

    // INFO ITEM EVENTS

    'click #btnDelInfoItem'(evt) {
        evt.preventDefault();

        let index = $(evt.currentTarget).data('index');
        let infoItem = this.topic.infoItems[index];
        let aTopic = createTopic(this.minutesID, this.topic._id);
        if (aTopic) {
            let item = aTopic.findInfoItem(infoItem._id);
            let isDeleteAllowed = item.isDeleteAllowed(this.minutesID);

            if (item.isSticky() || isDeleteAllowed) {
                let templateData = {
                    type: (item.isActionItem()) ? 'action item' : 'information',
                    isActionItem: item.isActionItem(),
                    subject: infoItem.subject,
                    deleteAllowed: isDeleteAllowed
                };

                let title = 'Confirm delete';
                let button = 'Delete';
                if (!isDeleteAllowed) {
                    title = (item.isActionItem()) ? 'Close action item?' : 'Unpin info item?';
                    button = (item.isActionItem()) ? 'Close action item' : 'Unpin info item';
                }

                let action = () => {
                    if (isDeleteAllowed) {
                        aTopic.removeInfoItem(infoItem._id);
                    } else {
                        if (item.isActionItem()) item.toggleState();
                        else item.toggleSticky();
                        item.save();
                    }
                };

                ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                    action,
                    title,
                    'confirmDeleteItem',
                    templateData,
                    button
                ).show();
            } else {
                ConfirmationDialogFactory.makeInfoDialog(
                    'Cannot delete item',
                    'It is not possible to delete this item because it was created in a previous minutes.' +
                    ((item.isActionItem())
                        ? ' This action item is already closed,'
                        : ' This info item is already un-pinned') +
                    ' so it won\'t be copied to the following minutes'
                ).show();
            }
        }
    },

    'click .btnToggleAIState'(evt) {
        evt.preventDefault();

        let index = $(evt.currentTarget).data('index');
        let infoItem = this.topic.infoItems[index];
        let aInfoItem = findInfoItem(this.minutesID, this.topic._id, infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            aInfoItem.toggleState();
            aInfoItem.save();
        }
    },

    'click .btnPinInfoItem'(evt) {
        evt.preventDefault();

        if (!this.isEditable) {
            return;
        }

        let index = $(evt.currentTarget).data('index');
        let infoItem = this.topic.infoItems[index];

        let aInfoItem = findInfoItem(this.minutesID, this.topic._id, infoItem._id);
        if (aInfoItem instanceof InfoItem) {
            aInfoItem.toggleSticky();
            aInfoItem.save();
        }
    },

    'click #btnEditInfoItem'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }
        if (getSelection().toString()) {    // don't fire while selection is ongoing
            return;
        }

        let index = $(evt.currentTarget).data('index');
        let infoItem = this.topic.infoItems[index];

        Session.set('topicInfoItemEditTopicId', this.topic._id);
        Session.set('topicInfoItemEditInfoItemId', infoItem._id);
        $('#dlgAddInfoItem').modal('show');
    },


    // Keep <a href=...> as clickable links inside detailText markdown
    'click .detailText a'(evt) {
        evt.stopPropagation();
    },


    'click .detailText'(evt, tmpl) {
        evt.preventDefault();

        if (!tmpl.data.isEditable) {
            return;
        }
        if (getSelection().toString()) {    // don't fire while selection is ongoing
            return;
        }

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);
        let detailActionsId = tmpl.$('#detailActions_' + detailId);

        if (inputEl.val() !== '') {
            return;
        }

        textEl.hide();
        inputEl.show();
        detailActionsId.show();

        inputEl.val(textEl.attr('data-text'));
        inputEl.parent().css('margin', '0 0 25px 0');
        inputEl.focus();
        resizeTextarea(inputEl);
    },

    'click .addDetail'(evt, tmpl) {
        evt.preventDefault();

        let index = $(evt.currentTarget).data('index');
        addNewDetails(tmpl, index)
            // todo properly report errors
            .catch(console.error);
    },

    'blur .detailInput'(evt, tmpl) {
        evt.preventDefault();

        let detailId = evt.currentTarget.getAttribute('data-id');
        let index = $(evt.currentTarget).data('item');
        let infoItem = tmpl.data.topic.infoItems[index];
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);
        let detailActionsEl = tmpl.$('#detailActions_' + detailId);

        let text = inputEl.val().trim();

        if (text === '' || (text !== textEl.attr('data-text'))) {
            let aMin = new Minutes(tmpl.data.minutesID);
            let aTopic = new Topic(aMin, tmpl.data.topic._id);
            let aActionItem = InfoItemFactory.createInfoItem(aTopic, infoItem._id);

            let detailIndex = detailId.split('_')[1]; // detail id is: <collapseId>_<index>
            if (text !== '') {
                aActionItem.updateDetails(detailIndex, text);
                aActionItem.save();
            } else {
                let deleteDetails = () => {
                    aActionItem.removeDetails(detailIndex);
                    aActionItem.save();
                    let detailsCount = aActionItem.getDetails().length;
                    if (detailsCount === 0) {
                        tmpl.$('#collapse-' + infoItem._id).collapse('hide');
                    }
                };

                let oldText = aActionItem.getDetailsAt(detailIndex).text;
                if (!oldText) {
                    // use case: Adding details and leaving the input field without entering any text should go silently.
                    deleteDetails();
                } else {
                    // otherwise we show an confirmation dialog before the deails will be removed
                    ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                        deleteDetails,
                        'Confirm delete',
                        'confirmDeleteDetails',
                        {subject: aActionItem.getSubject()}
                    ).show();
                }
            }
        }

        inputEl.val('');
        inputEl.hide();
        detailActionsEl.hide();

        textEl.show();
    },

    'keypress .detailInput'(evt, tmpl) {
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$(`#detailInput_${detailId}`);
        if (evt.which === 13/*enter*/ && evt.ctrlKey) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    'keyup .detailInput'(evt, tmpl) {
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$(`#detailInput_${detailId}`);

        // escape key will not be handled in keypress callback...
        if (evt.which === 27/*escape*/) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    'hide.bs.collapse'(evt, tmpl) {
        let index = $(evt.currentTarget).data('index');
        let collapseStates = tmpl.isItemCollapsed.get();
        collapseStates[index] = true;
        tmpl.isItemCollapsed.set(collapseStates);
    },
    'show.bs.collapse'(evt, tmpl) {
        let index = $(evt.currentTarget).data('index');
        let collapseStates = tmpl.isItemCollapsed.get();
        collapseStates[index] = false;
        tmpl.isItemCollapsed.set(collapseStates);
    },

    // Important! We have to use "mousedown" instead of "click" here.
    // -> for more details see next event handler
    'mousedown .detailInputDelete'(evt, tmpl) {
        evt.preventDefault();
        evt.stopPropagation();
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);
        inputEl.val('');
        inputEl.blur();
    },

    // Important! We have to use "mousedown" instead of "click" here.
    // Otherwise the detailsEdit textarea will loose focus and trigger
    // its blur-event which in turn makes the markdownhint icon invisible
    // which in turn swallow the click event - and nothing happens on click.
    'mousedown .detailInputMarkdownHint'(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        ConfirmationDialogFactory
            .makeInfoDialog('Help for Markdown Syntax')
            .setTemplate('markdownHint')
            .show();

    }
});