import moment from 'moment/moment';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';

import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { Topic } from '/imports/topic';
import { ActionItem } from '/imports/actionitem';
import { Priority } from '/imports/priority';
import { User, userSettings } from '/imports/users';

import { currentDatePlusDeltaDays } from '/imports/helpers/date';
import { emailAddressRegExpTest } from '/imports/helpers/email';

import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { handleError } from '/client/helpers/handleError';
import {createItem} from './helpers/create-item';
import {configureSelect2Labels} from './helpers/configure-select2-labels';
import {handlerShowMarkdownHint} from './helpers/handler-show-markdown-hint';
import {configureSelect2Responsibles} from '/imports/client/ResponsibleSearch';

Session.setDefault('topicInfoItemEditTopicId', null);
Session.setDefault('topicInfoItemEditInfoItemId', null);
Session.setDefault('topicInfoItemType', 'infoItem');

let _minutesID; // the ID of these minutes
let _meetingSeries; // ATTENTION - this var. is not reactive! It is cached for performance reasons!

Template.topicInfoItemEdit.onCreated(function () {
    _minutesID = this.data;
    console.log('Template topicEdit created with minutesID '+_minutesID);
    let aMin = new Minutes(_minutesID);
    _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());

    const user = new User();
    this.collapseState = new ReactiveVar(user.getSetting(userSettings.showAddDetail, true));
});

Template.topicInfoItemEdit.onRendered(function () {
    // Configure DateTimePicker
    moment.locale('en', {
        week: { dow: 1 } // Monday is the first day of the week
    });
    // see http://eonasdan.github.io/bootstrap-datetimepicker/Options/
    this.$('#id_item_duedatePicker').datetimepicker({
        format: 'YYYY-MM-DD',
        // calendarWeeks: true, // unfortunately this leads to "NaN" weeks on some systems...
        showTodayButton: true
    });
});

let getRelatedTopic = function() {
    let minutesId = _minutesID;
    let topicId = Session.get('topicInfoItemEditTopicId');

    if (minutesId === null ||  topicId === null) {
        return false;
    }

    return new Topic(minutesId, topicId);
};

let getEditInfoItem = function() {
    let id = Session.get('topicInfoItemEditInfoItemId');

    if (!id) return false;

    return getRelatedTopic().findInfoItem(id);
};

let toggleItemMode = function (type, tmpl) {
    let actionItemOnlyElements = tmpl.$('.actionItemOnly');
    Session.set('topicInfoItemType', type);
    let editItem = getEditInfoItem();
    let freeTextValidator = (text) => {
        return emailAddressRegExpTest.test(text);
    };
    switch (type) {
    case 'actionItem':
        actionItemOnlyElements.show();
        configureSelect2Responsibles('id_selResponsibleActionItem', editItem._infoItemDoc, freeTextValidator, _minutesID, editItem);
        break;
    case 'infoItem':
        actionItemOnlyElements.hide();
        break;
    default:
        Session.set('topicInfoItemType', null);
        throw new Meteor.Error('Unknown type!');
    }
};

let resizeTextarea = (element) => {

    let newLineRegEx = new RegExp(/\n/g);
    let textAreaValue = element.val();
    let occurrences;

    occurrences = (textAreaValue.match(newLineRegEx) || []).length;

    //limit of textarea size
    if(occurrences < 15) {
        if (occurrences === 0)
            element.attr('rows', occurrences + 2);
        else
            element.attr('rows', occurrences + 1);
    }
};

Template.topicInfoItemEdit.helpers({
    getPriorities: function() {
        return Priority.GET_PRIORITIES();
    },
    isEditMode: function () {
        return (getEditInfoItem() !== false);
    },

    getTopicSubject: function () {
        let topic = getRelatedTopic();
        return (topic) ? topic._topicDoc.subject : '';
    },

    getTopicItemType: function () {
        let type = Session.get('topicInfoItemType');
        return (type === 'infoItem') ? 'Information' : 'Action Item';
    },

    collapseState: function() {
        const user = new User();
        return user.getSetting(userSettings.showAddDetail, true);
    }
});

Template.topicInfoItemEdit.events({
    'submit #frmDlgAddInfoItem': async function(evt, tmpl) {
        evt.preventDefault();

        if (!getRelatedTopic()) {
            throw new Meteor.Error('IllegalState: We have no related topic object!');
        }
        const editItem = getEditInfoItem();

        const type = Session.get('topicInfoItemType');
        const newSubject = tmpl.find('#id_item_subject').value;
        const newDetail = (!editItem) ? tmpl.find('#id_item_detailInput').value : false;
        const labels = tmpl.$('#id_item_selLabelsActionItem').val();

        let doc = {};
        if (editItem) {
            _.extend(doc, editItem._infoItemDoc);
        }

        doc.subject = newSubject;

        if (type === 'actionItem') {
            doc.responsibles = $('#id_selResponsibleActionItem').val();
            doc.duedate = tmpl.find('#id_item_duedateInput').value;
            doc.priority = tmpl.find('#id_item_priority').value;
        }

        const minutes = new Minutes(_minutesID);
        const newItem = createItem(doc, getRelatedTopic(), _minutesID, minutes.parentMeetingSeries(), type, labels);

        if (newDetail) {
            newItem.addDetails(minutes._id, newDetail);
        }

        newItem.saveAsync().catch(handleError);
        $('#dlgAddInfoItem').modal('hide');
    },

    // will be called before the dialog is shown
    'show.bs.modal #dlgAddInfoItem': function (evt, tmpl) {
        // at this point we clear the view
        let saveButton = $('#btnInfoItemSave');
        let cancelButton = $('#btnInfoItemCancel');
        saveButton.prop('disabled',false);
        cancelButton.prop('disabled',false);

        let editItem = getEditInfoItem();

        let itemSubject = tmpl.find('#id_item_subject');
        itemSubject.value = (editItem) ? editItem._infoItemDoc.subject : '';

        tmpl.find('#id_item_priority').value = (editItem && (editItem instanceof ActionItem))
            ? editItem._infoItemDoc.priority : Priority.GET_DEFAULT_PRIORITY().value;

        tmpl.find('#id_item_duedateInput').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.duedate : currentDatePlusDeltaDays(7);

        const user = new User();
        tmpl.collapseState.set(user.getSetting(userSettings.showAddDetail, true));

        let detailsArea = tmpl.find('#id_item_detailInput');
        if (detailsArea) {
            detailsArea.value = '';
            detailsArea.setAttribute('rows', 2);
            if(tmpl.collapseState.get() === false) {
                detailsArea.style.display = 'none';
            }
        }

        configureSelect2Labels(_minutesID, '#id_item_selLabelsActionItem', getEditInfoItem());
        // set type: edit existing item
        if (editItem) {
            let type = (editItem instanceof ActionItem) ? 'actionItem' : 'infoItem';
            toggleItemMode(type, tmpl);
        } else {  // adding a new item
            let freeTextValidator = (text) => {
                return emailAddressRegExpTest.test(text);
            };
            let editItem = getEditInfoItem();
            configureSelect2Responsibles('id_selResponsibleActionItem', editItem._infoItemDoc, freeTextValidator, _minutesID, editItem);
            let selectResponsibles = $('#id_selResponsibleActionItem');
            if (selectResponsibles) {
                selectResponsibles.val([]).trigger('change');
            }
            let selectLabels = $('#id_item_selLabelsActionItem');
            if (selectLabels) {
                selectLabels.val([]).trigger('change');
            }
            let infoItemType = Session.get('topicInfoItemType');
            toggleItemMode(infoItemType, tmpl);

            if(infoItemType === 'infoItem') {
                itemSubject.value = 'Info';
            } else {
                itemSubject.value = '';
            }
        }
    },

    'shown.bs.modal #dlgAddInfoItem': function (evt, tmpl) {
        // ensure new values trigger placeholder animation
        $('#id_item_subject').trigger('change');
        $('#id_item_priority').trigger('change');
        let itemSubject = tmpl.find('#id_item_subject');
        itemSubject.focus();
        itemSubject.select();
    },

    'hidden.bs.modal #dlgAddInfoItem': function () {
        // reset the session var to indicate that edit mode has been closed
        Session.set('topicInfoItemEditTopicId', null);
        Session.set('topicInfoItemEditInfoItemId', null);
        Session.set('topicInfoItemType', null);
    },

    'select2:selecting #id_selResponsibleActionItem'(evt) {
        if (evt.params.args.data.id === evt.params.args.data.text) { // we have a free-text entry
            if (! emailAddressRegExpTest.test(evt.params.args.data.text)) {    // no valid mail anystring@anystring.anystring
                // prohibit non-mail free text entries
                ConfirmationDialogFactory.makeInfoDialog(
                    'Invalid Responsible',
                    'This is not a valid responsible!\n\nPlease select an **existing user** from the dropdown or enter a **valid email address**.'
                ).show();
                return false;
            }
        }
        return true;
    },

    'select2:select #id_selResponsibleActionItem'(evt) {
        let respId = evt.params.data.id;
        let respName = evt.params.data.text;
        let aUser = Meteor.users.findOne(respId);
        if (! aUser && respId === respName &&    // we have a free-text user here!
            emailAddressRegExpTest.test(respName)) { // only take valid mail addresses
            _meetingSeries.addAdditionalResponsible(respName);
            _meetingSeries.save();
        }
    },

    'click .detailInputMarkdownHint'(evt) {
        handlerShowMarkdownHint(evt);
    },

    'click #btnExpandCollapse': function (evt, tmpl) {
        evt.preventDefault();

        let detailsArea = tmpl.find('#id_item_detailInput');
        detailsArea.style.display = (detailsArea.style.display ==='none') ? 'inline-block' : 'none';

        tmpl.collapseState.set(!tmpl.collapseState.get());

        const user = new User();
        user.storeSetting(userSettings.showAddDetail, tmpl.collapseState.get());
    },

    'keyup #id_item_detailInput': function (evt, tmpl) {
        let inputEl = tmpl.$('#id_item_detailInput');

        if (evt.which === 13/*Enter*/ || evt.which === 8/*Backspace*/ || evt.which === 46/*Delete*/) {
            resizeTextarea(inputEl);
        }
    }
});