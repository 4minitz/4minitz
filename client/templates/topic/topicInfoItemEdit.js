import moment from 'moment/moment';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';

import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { Topic } from '/imports/topic';
import { InfoItem } from '/imports/infoitem';
import { ActionItem } from '/imports/actionitem';
import { Label } from '/imports/label';
import { Priority } from '/imports/priority';
import { User, userSettings } from '/imports/users';

import { ResponsiblePreparer } from '/imports/client/ResponsiblePreparer';
import { currentDatePlusDeltaDays } from '/imports/helpers/date';
import { emailAddressRegExpTest } from '/imports/helpers/email';

import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { handleError } from '/client/helpers/handleError';
import {LabelExtractor} from '../../../imports/services/labelExtractor';

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

    switch (type) {
    case 'actionItem':
        actionItemOnlyElements.show();
        configureSelect2Responsibles();
        break;
    case 'infoItem':
        actionItemOnlyElements.hide();
        break;
    default:
        Session.set('topicInfoItemType', null);
        throw new Meteor.Error('Unknown type!');
    }
};

function configureSelect2Responsibles() {
    let selectResponsibles = $('#id_selResponsibleActionItem');
    selectResponsibles.find('optgroup')     // clear all <option>s
        .remove();
    let delayTime = Meteor.settings.public.isEnd2EndTest ? 0 : 50;

    selectResponsibles.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        ajax: {
            delay: delayTime,
            transport: function(params, success, failure) {
                Meteor.call('responsiblesSearch', params.data.q, _minutesID, false, function(err, results) {
                    if (err) {
                        failure(err);
                        return;
                    }
                    success(results);
                });
            },
            processResults: function(data) {
                let results_participants = [];
                let results_other = [];
                _.each(data.results, function (result) {
                    if (result.isParticipant) {
                        results_participants.push({
                            id: result.userId,
                            text: result.fullname
                        });
                    }
                    else results_other.push({
                        id: result._id,
                        text: result.fullname
                    });
                });
                // save the return value (when participants/other user are empty -> do not show a group-name
                let returnValues = [];
                if (results_participants.length > 0)
                    returnValues.push({text:'Participants', children: results_participants});
                if (results_other.length > 0)
                    returnValues.push({text:'Other Users', children: results_other});

                return {
                    results:returnValues
                };
            }}
    });

    // select the options that where stored with this topic last time
    let editItem = getEditInfoItem();
    if (editItem) {
        selectResponsibles.val(editItem.getResponsibleRawArray());
    }
    selectResponsibles.trigger('change');
}

function configureSelect2Labels() {
    let aMin = new Minutes(_minutesID);
    let aSeries = aMin.parentMeetingSeries();

    let selectLabels = $('#id_item_selLabelsActionItem');
    selectLabels.find('option')     // clear all <option>s
        .remove();

    let selectOptions = [];

    aSeries.getAvailableLabels().forEach(label => {
        selectOptions.push ({id: label._id, text: label.name});
    });

    selectLabels.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        data: selectOptions             // push <option>s data
    });


    // select the options that where stored with this topic last time
    let editItem = getEditInfoItem();
    if (editItem) {
        selectLabels.val(editItem.getLabelsRawArray());
    }
    selectLabels.trigger('change');
}

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

        let type = Session.get('topicInfoItemType');
        let newSubject = tmpl.find('#id_item_subject').value;
        let newDetail;

        if(getEditInfoItem() === false) {
            newDetail = tmpl.find('#id_item_detailInput').value;
        }

        let editItem = getEditInfoItem();
        let doc = {};
        if (editItem) {
            _.extend(doc, editItem._infoItemDoc);
        }

        let labels = tmpl.$('#id_item_selLabelsActionItem').val();
        if (!labels) labels = [];
        let aMinute = new Minutes(_minutesID);
        let aSeries = aMinute.parentMeetingSeries();
        labels = labels.map(labelId => {
            let label = Label.createLabelById(aSeries, labelId);
            if (null === label) {
                // we have no such label -> it's brand new
                label = new Label({name: labelId});
                label.save(aSeries._id);
            }
            return label.getId();
        });

        doc.subject = newSubject;
        if (!doc.createdInMinute) {
            doc.createdInMinute = _minutesID;
        }
        doc.labels = labels;

        let newItem;
        switch (type) {
        case 'actionItem':
            doc.responsibles = $('#id_selResponsibleActionItem').val();
            doc.duedate = tmpl.find('#id_item_duedateInput').value;

            newItem = new ActionItem(getRelatedTopic(), doc);
            newItem.setPriority(new Priority(tmpl.find('#id_item_priority').value));
            break;
        case 'infoItem':
        {
            newItem = new InfoItem(getRelatedTopic(), doc);
            break;
        }
        default:
            throw new Meteor.Error('Unknown type!');
        }

        const labelExtractor = new LabelExtractor(newSubject, aMinute.parentMeetingSeries()._id);
        newItem.addLabelsById(labelExtractor.getExtractedLabelIds());
        newItem.setSubject(labelExtractor.getCleanedString());
        newItem.saveAsync().catch(handleError);
        if (getEditInfoItem() === false && newDetail) {
            newItem.addDetails(aMinute._id, newDetail);
            // TODO: Here we have two save operations almost parallel! Add the details before saving the item at the first place.
            newItem.saveAsync().catch(handleError);
        }
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

        // set type: edit existing item
        if (editItem) {
            let type = (editItem instanceof ActionItem) ? 'actionItem' : 'infoItem';
            toggleItemMode(type, tmpl);
        } else {  // adding a new item
            configureSelect2Responsibles();
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
        configureSelect2Labels();
    },

    'hidden.bs.modal #dlgAddInfoItem': function () {
        // reset the session var to indicate that edit mode has been closed
        Session.set('topicInfoItemEditTopicId', null);
        Session.set('topicInfoItemEditInfoItemId', null);
        Session.set('topicInfoItemType', null);
    },

    'select2:selecting #id_selResponsibleActionItem'(evt) {
        console.log(evt);
        console.log('selecting:'+evt.params.args.data.id + '/'+evt.params.args.data.text);
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
        console.log('select:'+evt.params.data.id + '/'+evt.params.data.text);
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
        evt.preventDefault();
        evt.stopPropagation();
        ConfirmationDialogFactory
            .makeInfoDialog('Help for Markdown Syntax')
            .setTemplate('markdownHint')
            .show();

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