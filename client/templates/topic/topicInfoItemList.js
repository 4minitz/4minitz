import { Topic } from '/imports/topic';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { InfoItem } from '/imports/infoitem';
import { ActionItem } from '/imports/actionitem';
import { Minutes } from '/imports/minutes';
import { ReactiveVar } from 'meteor/reactive-var';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import {InfoItemFactory} from '../../../imports/InfoItemFactory';
import { handleError } from '../../helpers/handleError';
import { formatDateISO8601 } from '/imports/helpers/date';
import {LabelResolver} from '../../../imports/services/labelResolver';
import {ResponsibleResolver} from '../../../imports/services/responsibleResolver';
import { MinutesFinder } from '../../../imports/services/minutesFinder';
import { MeetingSeries } from '../../../imports/meetingseries';

const INITIAL_ITEMS_LIMIT = 4;

export class TopicInfoItemListContext {

    static createReadonlyContextForItemsOfDifferentTopics(items, meetingSeriesId) {
        return new TopicInfoItemListContext(items, true, meetingSeriesId);
    }

    static createContextForItemsOfOneTopic(items, isReadonly, topicParentId, parentTopicId) {
        return new TopicInfoItemListContext(items, isReadonly, topicParentId, parentTopicId);
    }

    constructor (items, isReadonly, topicParentId = null, parentTopicId = null) {
        this.items = (!parentTopicId) ? items : items.map(item => {
            item.parentTopicId = parentTopicId;
            return item;
        });
        this.isReadonly = isReadonly;
        this.topicParentId = topicParentId;
    }
}

Template.topicInfoItemList.onCreated(function () {
    /** @type {TopicInfoItemListContext} */
    let tmplData = Template.instance().data;
    this.isItemsLimited = new ReactiveVar(tmplData.items.length > INITIAL_ITEMS_LIMIT);

    // Dict maps Item._id => true/false, where true := "expanded state"
    // per default: everything is undefined => collapsed!
    this.isItemExpanded = new ReactiveVar({});
});

let updateItemSorting = (evt, ui) => {
    let item = ui.item,
        sorting = item.parent().find('> .topicInfoItem'),
        topic = new Topic(item.attr('data-topic-parent-id'), item.attr('data-parent-id')),
        newItemSorting = [];

    for (let i = 0; i < sorting.length; ++i) {
        let itemId = $(sorting[i]).attr('data-id');
        let item = topic.findInfoItem(itemId);

        newItemSorting.push(item.getDocument());
    }

    topic.setItems(newItemSorting);
    topic.save().catch(error => {
        $('.itemPanel').sortable( 'cancel' );
        handleError(error);
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

const performActionForItem = (evt, tmpl, action) => {
    evt.preventDefault();
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;

    if (context.isReadonly) {
        return;
    }

    const index = evt.currentTarget.getAttribute('data-index');
    const infoItem = context.items[index];
    const aInfoItem = findInfoItem(context.topicParentId, infoItem.parentTopicId, infoItem._id);
    action(aInfoItem);
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

function getDetails(tmpl, infoItemIndex) {
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;
    const item = context.items[infoItemIndex];
    return (item) ? item.details || [] : [];
}

Template.topicInfoItemList.onRendered(function () {
    if (!Template.instance().data.isReadonly) {
        initializeDragAndDrop(this);
    }
});

let addNewDetails = async (tmpl, index) => {
    /** @type {TopicInfoItemListContext} */
    const context = tmpl.data;
    if (context.isReadonly) {
        return;
    }
    let aMin = new Minutes(context.topicParentId);
    let infoItem = context.items[index];
    let aTopic = new Topic(aMin, infoItem.parentTopicId);
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
    topicStateClass: function (index) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        let infoItem = context.items[index];
        if (infoItem && infoItem.itemType !== 'actionItem') {
            return 'infoitem';
        } else if (infoItem && infoItem.isOpen) {
            let todayDate = formatDateISO8601(new Date());
            if (infoItem.duedate && infoItem.duedate === todayDate) {
                return 'actionitem-open-due-today';
            }
            if (infoItem.duedate && infoItem.duedate < todayDate) {
                return 'actionitem-open-due-over';
            }
            return 'actionitem-open';
        } else {
            return 'actionitem-closed';
        }
    },

    hasDetails: function (index) {
        let details = getDetails(Template.instance(), index);
        return details.length > 0;
    },

    detailsArray: function (index) {
        return getDetails(Template.instance(), index);
    },

    isExpanded(itemID) {
        let allItemsExpandedState = Template.instance().isItemExpanded.get();
        return allItemsExpandedState[itemID];
    },

    isActionItem: function(index) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        const item = context.items[index];
        return (item && item.itemType === 'actionItem');
    },

    isInfoItem: function(index) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        const item = context.items[index];
        return (item && context.items[index].itemType === 'infoItem');
    },

    isDetailNew: function(indexs) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        const item = context.items[indexs.hash.infoIndex];
        const detail = item.details[indexs.hash.detailIndex];

        const lastFinalizedMinuteId = (FlowRouter.getRouteName() === 'minutesedit')
            ? context.topicParentId
            : MinutesFinder.lastMinutesOfMeetingSeries(new MeetingSeries(context.topicParentId))._id;

        return detail.createdInMinute === lastFinalizedMinuteId;
    },

    checkedState: function (index) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        let infoItem = context.items[index];
        if (infoItem && infoItem.itemType === 'infoItem' || infoItem.isOpen) {
            return '';
        } else {
            return {checked: 'checked'};
        }
    },

    disabledState: function () {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        if (context.isReadonly) {
            return {disabled: 'disabled'};
        } else {
            return '';
        }
    },

    cursorForEdit() {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        if (context.isReadonly) {
            return '';
        } else {
            return 'pointer';
        }
    },

    responsiblesHelper(index) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        const infoItem = context.items[index];
        if (!infoItem) {
            return;
        }
        const responsible = ResponsibleResolver.resolveAndformatResponsiblesString(infoItem.responsibles);
        return (responsible) ? `(${responsible})` : '';
    },

    getLabels: function(index) {
        /** @type {TopicInfoItemListContext} */
        const context = Template.instance().data;
        const infoItem = context.items[index];
        if (!infoItem) {
            return;
        }
        return LabelResolver.resolveLabels(infoItem.labels, getMeetingSeriesId(context.topicParentId))
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

    'click #btnDelInfoItem'(evt, tmpl) {
        /** @type {TopicInfoItemListContext} */
        const context = tmpl.data;
        performActionForItem(evt, tmpl, (item) => {
            let isDeleteAllowed = item.isDeleteAllowed(context.topicParentId);

            if (item.isSticky() || isDeleteAllowed) {
                let templateData = {
                    type: (item.isActionItem()) ? 'action item' : 'information',
                    isActionItem: item.isActionItem(),
                    subject: item.getSubject(),
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
                        item.getParentTopic().removeInfoItem(item.getId()).catch(handleError);
                    } else {
                        if (item.isActionItem()) item.toggleState();
                        else item.toggleSticky();
                        item.save().catch(handleError);
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
        });
    },

    'click .btnToggleAIState'(evt, tmpl) {
        performActionForItem(evt, tmpl, (item) => {
            if (item instanceof ActionItem) {
                item.toggleState();
                item.save().catch(handleError);
            }
        });
    },

    'click .btnPinInfoItem'(evt, tmpl) {
        performActionForItem(evt, tmpl, (item) => {
            if (item instanceof InfoItem) {
                item.toggleSticky();
                item.save().catch(handleError);
            }
        });
    },

    'click .btnEditInfoItem'(evt, tmpl) {
        evt.preventDefault();
        /** @type {TopicInfoItemListContext} */
        const context = tmpl.data;

        if (context.isReadonly) {
            return;
        }
        if (getSelection().toString()) {    // don't fire while selection is ongoing
            return;
        }

        let index = evt.currentTarget.getAttribute('data-index');
        let infoItem = context.items[index];

        Session.set('topicInfoItemEditTopicId', infoItem.parentTopicId);
        Session.set('topicInfoItemEditInfoItemId', infoItem._id);
        $('#dlgAddInfoItem').modal('show');
    },


    // Keep <a href=...> as clickable links inside detailText markdown
    'click .detailText a'(evt) {
        evt.stopPropagation();
    },


    'click .detailText'(evt, tmpl) {
        evt.preventDefault();
        /** @type {TopicInfoItemListContext} */
        const context = tmpl.data;

        if (context.isReadonly) {
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
        /** @type {TopicInfoItemListContext} */
        const context = tmpl.data;

        if (context.isReadonly) {
            return;
        }

        let index = evt.currentTarget.getAttribute('data-index');
        addNewDetails(tmpl, index).catch(handleError);
    },

    'blur .detailInput'(evt, tmpl) {
        evt.preventDefault();
        /** @type {TopicInfoItemListContext} */
        const context = tmpl.data;

        if (context.isReadonly) {
            return;
        }

        let detailId = evt.currentTarget.getAttribute('data-id');
        let index = $(evt.currentTarget).data('item');
        let infoItem = context.items[index];
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);
        let detailActionsEl = tmpl.$('#detailActions_' + detailId);

        let text = inputEl.val().trim();

        if (text === '' || (text !== textEl.attr('data-text'))) {
            let aMin = new Minutes(context.topicParentId);
            let aTopic = new Topic(aMin, infoItem.parentTopicId);
            let aActionItem = InfoItemFactory.createInfoItem(aTopic, infoItem._id);

            let detailIndex = detailId.split('_')[1]; // detail id is: <collapseId>_<index>
            if (text !== '') {
                aActionItem.updateDetails(detailIndex, text);
                aActionItem.save().catch(handleError);
            } else {
                let deleteDetails = () => {
                    aActionItem.removeDetails(detailIndex);
                    aActionItem.save().catch(handleError);
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
        let itemID = $(evt.currentTarget).data('itemid');
        let expandStates = tmpl.isItemExpanded.get();
        expandStates[itemID] = false;
        tmpl.isItemExpanded.set(expandStates);
    },
    'show.bs.collapse'(evt, tmpl) {
        let itemID = $(evt.currentTarget).data('itemid');
        let expandStates = tmpl.isItemExpanded.get();
        expandStates[itemID] = true;
        tmpl.isItemExpanded.set(expandStates);
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