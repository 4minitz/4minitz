import { Minutes } from '/imports/minutes';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { MeetingSeries } from '/imports/meetingseries';
import { Topic } from '/imports/topic';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import { FlashMessage } from '../../helpers/flashMessage';
import { TopicInfoItemListContext } from './topicInfoItemList';
import {LabelResolver} from '../../../imports/services/labelResolver';
import {ResponsibleResolver} from '../../../imports/services/responsibleResolver';
import {labelSetFontColor} from './helpers/label-set-font-color';
import { handleError } from '../../helpers/handleError';
import {detectTypeAndCreateItem} from './helpers/create-item';
import {resizeTextarea} from './helpers/resize-textarea';
import {setupAutocomplete, createLabelStrategy, createResponsibleStrategy} from '../../helpers/autocomplete';
import {ResponsiblePreparer} from '../../../imports/client/ResponsiblePreparer';
import { emailAddressRegExpTest } from '/imports/helpers/email';

let _minutesId;

let onError = (error) => {
    (new FlashMessage('Error', error.reason)).show();
};

const INITIAL_ITEMS_LIMIT = 4;

const isFeatureShowItemInputFieldOnDemandEnabled = () => {
    return !(Meteor.settings && Meteor.settings.public && Meteor.settings.public.isEnd2EndTest);
};

Template.topicElement.onCreated(function () {
    let tmplData = Template.instance().data;
    _minutesId = tmplData.minutesID;

    this.isItemsLimited = new ReactiveVar(tmplData.topic.infoItems.length > INITIAL_ITEMS_LIMIT);
    this.isCollapsed = new ReactiveVar(false);
    this.availableLabelsReactive = new ReactiveVar([]);
    this.responsiblesReactive = new ReactiveVar([]);
    this.autorun(() => {
        const availableLabels = (new MeetingSeries(tmplData.parentMeetingSeriesId)).getAvailableLabels();
        this.availableLabelsReactive.set(availableLabels);
        const freeTextValidator = (text) => {
            return emailAddressRegExpTest.test(text);
        };
        const responsiblePreparer =
            new ResponsiblePreparer(new Minutes(tmplData.minutesID), null, Meteor.users, freeTextValidator);
        const responsibles =
            responsiblePreparer.getPossibleResponsibles().concat(responsiblePreparer.getRemainingUsers());
        this.responsiblesReactive.set(responsibles);
    });
});

Template.topicElement.onRendered(function() {
    const createFetcher = (reactiveVar) => {
        return (callback) => { callback(reactiveVar.get()) }
    };
    const strategies = [
        createLabelStrategy(createFetcher(this.availableLabelsReactive)),
        createResponsibleStrategy(createFetcher(this.responsiblesReactive))
    ];
    $('.add-item-field').each(function() {
        setupAutocomplete(this, strategies);
    });
});

Template.topicElement.helpers({
    hideAddItemInputField() {
        return isFeatureShowItemInputFieldOnDemandEnabled();
    },

    getLabels: function() {
        let tmplData = Template.instance().data;
        return LabelResolver.resolveLabels(this.topic.labels, tmplData.parentMeetingSeriesId).map(labelSetFontColor);
    },

    checkedState: function () {
        if (this.topic.isOpen) {
            return '';
        } else {
            return {checked: 'checked'};
        }
    },

    disabledState: function () {
        if ((this.isEditable) && (!this.topic.isSkipped)) {
            return '';
        } else {
            return {disabled: 'disabled'};
        }
    },

    // determine if this topic shall be rendered collapsed
    isCollapsed() {
        let collapseState = Session.get('minutesedit.collapsetopics.'+_minutesId);
        return collapseState ? collapseState[this.topic._id] : false;
    },

    showRecurringIcon() {
        return (this.isEditable || this.topic.isRecurring);
    },

    responsiblesHelper() {
        try {
            const responsible = ResponsibleResolver.resolveAndformatResponsiblesString(this.topic.responsibles);
            return (responsible) ? `(${responsible})` : '';
        } catch (e) {
            // intentionally left blank.
            // on deletion of a topic blaze once calls this method on the just deleted topic
            // we handle this gracefully with this empty exception handler
        }
        return '';
    },

    getData() {
        const data = Template.instance().data;
        const parentElement = (data.minutesID) ? data.minutesID : data.parentMeetingSeriesId;
        return TopicInfoItemListContext.createContextForItemsOfOneTopic(
            data.topic.infoItems,
            !data.isEditable,
            parentElement,
            data.topic._id
        );
    },

    classForEdit() {
        return this.isEditable ? 'btnEditTopic' : '';
    },
    
    classForSkippedTopics() {
        return this.topic.isSkipped ? 'strikethrough' : '';
    },
    
    cursorForEdit() {
        return this.isEditable ? 'pointer' : '';
    },
    
    showMenu() {
        return ((this.isEditable) || // Context: Current non-finalized Minute
            (!this.minutesID && !this.topic.isOpen && new MeetingSeries(this.parentMeetingSeriesId).isCurrentUserModerator())); // Context: Closed Topic within MeetingSeries, user is moderator;
    }
});

const editTopicEventHandler = (evt, context, manipulateTopic) => {
    evt.preventDefault();
    if (!context.minutesID || !context.isEditable) {
        return;
    }
    const aTopic = new Topic(context.minutesID, context.topic._id);
    manipulateTopic(aTopic);
};

const openAddItemDialog = (itemType, topicId) => {
    Session.set('topicInfoItemEditTopicId', topicId);
    Session.set('topicInfoItemType', itemType);
};
const showHideItemInput = (tmpl, show = true) => {
    if (!isFeatureShowItemInputFieldOnDemandEnabled()) {
        return;
    }

    tmpl.$('.addItemForm').css('display', (show) ? 'block' : 'none');
    if (show) {
        resizeTextarea(tmpl.$('.add-item-field'));
    }
};

let savingNewItem = false;

Template.topicElement.events({
    'mouseover .topic-element'(evt, tmpl) {
        showHideItemInput(tmpl);
    },
    'mouseout .topic-element'(evt, tmpl) {
        const activeElement = document.activeElement;
        const topicElement = tmpl.find('.topic-element');
        if (!activeElement || !topicElement.contains(activeElement)) {
            showHideItemInput(tmpl, false);
        }
    },

    'focus .topic-element'(evt, tmpl) {
        tmpl.$('.topic-element').addClass('focus');
        showHideItemInput(tmpl);
    },

    'blur .topic-element'(evt, tmpl) {
        if (savingNewItem) {
            savingNewItem = false;
            return;
        }
        const nextElement = evt.relatedTarget;
        const topicElement = tmpl.find('.topic-element');
        if (!nextElement || !topicElement.contains(nextElement)) {
            tmpl.$('.topic-element').removeClass('focus');
            Meteor.setTimeout(() => { showHideItemInput(tmpl, false); }, 500);
        }
    },

    'click #btnDelTopic'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }
        console.log('Delete topics: '+this.topic._id+' from minutes '+this.minutesID);

        let aMin = new Minutes(this.minutesID);

        let topic = new Topic(this.minutesID, this.topic);
        const deleteAllowed = topic.isDeleteAllowed();

        if (!topic.isClosedAndHasNoOpenAIs() || deleteAllowed) {
            ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                () => {
                    if (deleteAllowed) {
                        aMin.removeTopic(this.topic._id).catch(onError);
                    } else {
                        topic.closeTopicAndAllOpenActionItems().catch(onError);
                    }
                },
                deleteAllowed ? 'Confirm delete' : 'Close topic?',
                'confirmDeleteTopic',
                {
                    deleteAllowed: topic.isDeleteAllowed(),
                    hasOpenActionItems: topic.hasOpenActionItem(),
                    subject: topic.getSubject()
                },
                deleteAllowed ? 'Delete' : 'Close topic and actions'
            ).show();
        } else {
            ConfirmationDialogFactory.makeInfoDialog(
                'Cannot delete topic',
                'It is not possible to delete this topic because it was created in a previous minutes. ' +
                'The selected topic is already closed and has no open action items, so it won\'t be copied to the ' +
                'following minutes'
            ).show();
        }
    },

    'click .btnToggleState'(evt) {
        editTopicEventHandler(evt, this, (aTopic) => {
            aTopic.toggleState().catch(onError);
        });
    },

    'click .js-toggle-recurring'(evt) {
        editTopicEventHandler(evt, this, (aTopic) => {
            aTopic.toggleRecurring();
            aTopic.save().catch(onError);
        });
    },
    
    'click .js-toggle-skipped'(evt) {
        editTopicEventHandler(evt, this, (aTopic) => {
            aTopic.toggleSkip();
            aTopic.save().catch(onError);
        });
    },

    'click #btnEditTopic'(evt) {
        evt.preventDefault();
        if (!this.minutesID || getSelection().toString()) { // don't fire while selection is ongoing
            return;
        }
        Session.set('topicEditTopicId', this.topic._id);
        $('#dlgAddTopic').modal('show');
    },

    'click .addTopicInfoItem'(evt) {
        evt.preventDefault();
        // will be called before the modal dialog is shown
        openAddItemDialog('infoItem', this.topic._id);
    },

    'click .addTopicActionItem'(evt) {
        evt.preventDefault();
        // will be called before the modal dialog is shown
        openAddItemDialog('actionItem', this.topic._id);
    },

    'blur .addItemForm' (evt, tmpl) {
        if (!tmpl.data.isEditable) {
            throw new Meteor.Error('illegal-state', 'Tried to call an illegal event in read-only mode');
        }

        const inputText = tmpl.find('.add-item-field').value;

        if (inputText === '') {
            return;
        }

        savingNewItem = true;
        const splitIndex = inputText.indexOf('\n');
        const subject = (splitIndex === -1) ? inputText : inputText.substring(0, splitIndex);
        const detail = (splitIndex === -1) ? '' : inputText.substring(splitIndex + 1).trim();

        const itemDoc = {
            subject: subject,
            responsibles: [],
            createdInMinute: this.minutesID
        };

        const topic = new Topic(this.minutesID, this.topic);
        const minutes = new Minutes(this.minutesID);
        const newItem = detectTypeAndCreateItem(itemDoc, topic, this.minutesID, minutes.parentMeetingSeries());
        if (detail) {
            newItem.addDetails(this.minutesID, detail);
        }
        newItem.saveAtBottom().catch(error => {
            tmpl.find('.add-item-field').value = inputText; // set desired value again!
            handleError(error);
        });
        tmpl.find('.add-item-field').value = '';
        tmpl.$('.add-item-field').focus();
        resizeTextarea(tmpl.$('.add-item-field'));

        let collapseState = Session.get('minutesedit.collapsetopics.'+_minutesId);
        if (!collapseState) {
            collapseState = {};
        }
        collapseState[this.topic._id] = false;
        Session.set('minutesedit.collapsetopics.'+_minutesId, collapseState);
    },

    'keypress .addItemForm' (evt, tmpl) {
        const inputEl = tmpl.$('.add-item-field');
        if (evt.which === 13/*enter*/ && evt.ctrlKey) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    'keyup .addItemForm'(evt, tmpl) {
        const inputEl = tmpl.$('.add-item-field');
        if (evt.which === 27/*escape*/) {
            inputEl.val('');
            inputEl.blur();
        }

        resizeTextarea(tmpl.$('.add-item-field'));
    },

    'keydown #btnTopicExpandCollapse'(evt) {
        // since we do not have a link-href the link will not be clicked when hitting enter by default...
        if (evt.which === 13/*enter*/) {
            evt.currentTarget.click();
        }
    },

    'click #btnTopicExpandCollapse'(evt) {
        console.log('btnTopicExpandCollapse()'+this.topic._id);
        evt.preventDefault();
        let collapseState = Session.get('minutesedit.collapsetopics.'+_minutesId);
        if (!collapseState) {
            collapseState = {};
        }
        collapseState[this.topic._id] = ! collapseState[this.topic._id];
        Session.set('minutesedit.collapsetopics.'+_minutesId, collapseState);
    },
    
    'click #btnReopenTopic'(evt) {
        evt.preventDefault();
        let reopenTopic = () => {
            Meteor.call('workflow.reopenTopicFromMeetingSeries', this.parentMeetingSeriesId, this.topic._id);
        };
        ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
            reopenTopic,
            'Re-open Topic',
            'confirmReOpenTopic',
            {
                topicSubject: Template.instance().data.topic.subject
            },
            'Re-open'
        ).show(); 
    }
});