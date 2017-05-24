import moment from 'moment/moment';

import { Meteor } from 'meteor/meteor';

import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';

import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { Topic } from '/imports/topic';
import { InfoItem } from '/imports/infoitem';
import { ActionItem } from '/imports/actionitem';
import { Label } from '/imports/label';

import { ResponsiblePreparer } from '/imports/client/ResponsiblePreparer';
import { currentDatePlusDeltaDays } from '/imports/helpers/date';
import { emailAddressRegExpTest } from '/imports/helpers/email';

import { $ } from 'meteor/jquery';
import { handleError } from '/client/helpers/handleError';


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
    this.collapseState = new ReactiveVar(false);
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
    let freeTextValidator = (text) => {
        return emailAddressRegExpTest.test(text);
    };
    let preparer = new ResponsiblePreparer(new Minutes(_minutesID), getEditInfoItem(), Meteor.users, freeTextValidator);

    let selectResponsibles = $('#id_selResponsibleActionItem');
    selectResponsibles.find('optgroup')     // clear all <option>s
        .remove();
    let possResp = preparer.getPossibleResponsibles();
    let remainingUsers = preparer.getRemainingUsers();
    let selectOptions = [{
        text: 'Participants',
        children: possResp
    }, {
        text: 'Other Users',
        children: remainingUsers
    }];

    selectResponsibles.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        data: selectOptions             // push <option>s data
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

    let b = element.val().match(/\n/gi);

    console.log(b);

    var r = parseInt((element.val().length + 10) / element.cols, 10);

    console.log(element.val().length + 10);
    console.log(element.cols);
/*
    if (r>0) element.rows = r; else element.rows = 1;

    if(b) element.rows += b.length;
    element.rows++;
*/
    console.log(element.rows);

    element.css('rows', 4)

    /*
    let scrollPos = $(document).scrollTop();
    element.css('height', 'auto');
    element.css('height', element.prop('scrollHeight') + 'px');
    $(document).scrollTop(scrollPos);*/
};

Template.topicInfoItemEdit.helpers({
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
        return Template.instance().collapseState.get();
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
        let newDetail = tmpl.find('#id_item_detailInput').value;

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
            doc.priority = tmpl.find('#id_item_priority').value;
            doc.responsibles = $('#id_selResponsibleActionItem').val();
            doc.duedate = tmpl.find('#id_item_duedateInput').value;

            newItem = new ActionItem(getRelatedTopic(), doc);
            break;
        case 'infoItem':
            {
                newItem = new InfoItem(getRelatedTopic(), doc);
                break;
            }
        default:
            throw new Meteor.Error('Unknown type!');
        }

        newItem.extractLabelsFromSubject(aMinute.parentMeetingSeries());
        let itemAlreadyExists = !!newItem.getId();
        newItem.saveAsync().catch(handleError);
        console.log('Successfully saved new item with id: ' + newItem.getId());
        if (newDetail) {
            newItem.addDetails(aMinute._id, newDetail);
            newItem.saveAsync().catch(handleError);
            let details = newItem.getDetails();
            let detailItem = newItem.getDetailsAt(details.length-1);
            console.log('Successfully saved new detail with id: ' + detailItem._id);
            tmpl.find('#id_item_detailInput').value = "";
        }
        $('#dlgAddInfoItem').modal('hide');
        if (!itemAlreadyExists) {
            Session.set('topicInfoItem.triggerAddDetailsForItem', newItem.getId());
        }
    },

    // will be called before the dialog is shown
    'show.bs.modal #dlgAddInfoItem': function (evt, tmpl) {
        // at this point we clear the view
        let saveButton = $('#btnInfoItemSave');
        let cancelButton = $('#btnInfoItemCancel');
        saveButton.prop('disabled',false);
        cancelButton.prop('disabled',false);

        let editItem = getEditInfoItem();
        tmpl.find('#id_item_subject').value = (editItem) ? editItem._infoItemDoc.subject : '';

        tmpl.find('#id_item_priority').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.priority : '';

        tmpl.find('#id_item_duedateInput').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.duedate : currentDatePlusDeltaDays(7);

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
            toggleItemMode(Session.get('topicInfoItemType'), tmpl);
        }
    },

    'shown.bs.modal #dlgAddInfoItem': function (evt, tmpl) {
        // ensure new values trigger placeholder animation
        $('#id_item_subject').trigger('change');
        $('#id_item_priority').trigger('change');
        tmpl.find('#id_item_subject').focus();
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

        let detailsArea = document.getElementById('id_item_detailInput');
        detailsArea.style.display = (detailsArea.style.display ==='none') ? 'inline-block' : 'none';
        tmpl.collapseState.set(!tmpl.collapseState.get());
    },

    'keypress #id_item_detailInput': function (evt, tmpl) {
        let inputEl = tmpl.$(`#id_item_detailInput`);

        resizeTextarea(inputEl);

        console.log(inputEl);
/*
        if (evt.which === 13 ) {
         var rows = inputEl.rows;
         rows++;
            inputEl[0].rows(rows);
         }*/






    }

});