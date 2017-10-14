import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { Topic } from '/imports/topic';
import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { Label } from '/imports/label';
import { ResponsiblePreparer } from '/imports/client/ResponsiblePreparer';
import {ConfirmationDialogFactory} from '../../helpers/confirmationDialogFactory';
import { $ } from 'meteor/jquery';
import { handleError } from '/client/helpers/handleError';
import {createTopic} from './helpers/create-topic';
import {configureSelect2Labels} from './helpers/configure-select2-labels';
import {convertOrCreateLabelsFromStrings} from './helpers/convert-or-create-label-from-string';
import {IsEditedService} from "../../../imports/services/isEditedService";

Session.setDefault('topicEditTopicId', null);

let _minutesID; // the ID of these minutes
let _meetingSeries; // ATTENTION - this var. is not reactive!

Template.topicEdit.onCreated(function () {
    _minutesID = this.data;
    console.log('Template topicEdit created with minutesID '+_minutesID);
    let aMin = new Minutes(_minutesID);
    _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());
});

let getEditTopic = function() {
    let topicId = Session.get('topicEditTopicId');

    if (_minutesID === null ||  topicId === null) {
        return false;
    }

    return new Topic(_minutesID, topicId);
};

function configureSelect2Responsibles() {
    let preparer = new ResponsiblePreparer(new Minutes(_minutesID), getEditTopic(), Meteor.users);

    let selectResponsibles = $('#id_selResponsible');
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
    let topic = getEditTopic();
    if (topic && topic._topicDoc && topic._topicDoc.responsibles) {
        selectResponsibles.val(topic._topicDoc.responsibles);
    }
    selectResponsibles.trigger('change');
}

Template.topicEdit.helpers({
    'getTopicSubject': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.subject : '';
    }
});

Template.topicEdit.events({
    'submit #frmDlgAddTopic': async function (evt, tmpl) {
        evt.preventDefault();

        let editTopic = getEditTopic();
        let topicDoc = {};
        if (editTopic) {
            IsEditedService.removeIsEditedTopic(_minutesID, editTopic._topicDoc._id);
            _.extend(topicDoc, editTopic._topicDoc);
        }

        let labels = tmpl.$('#id_item_selLabels').val();
        if (!labels) labels = [];
        let aMinute = new Minutes(_minutesID);
        let aSeries = aMinute.parentMeetingSeries();
        labels = convertOrCreateLabelsFromStrings(labels, aSeries);

        topicDoc.subject = tmpl.find('#id_subject').value;
        topicDoc.responsibles = $('#id_selResponsible').val();
        topicDoc.labels = labels;

        const aTopic = createTopic(_minutesID, aSeries._id, topicDoc);
        aTopic.save().catch(handleError);
        $('#dlgAddTopic').modal('hide');
    },

    'hidden.bs.modal #dlgAddTopic': function (evt, tmpl) {
        $('#frmDlgAddTopic')[0].reset();
        let subjectNode = tmpl.$('#id_subject');
        subjectNode.parent().removeClass('has-error');

        // reset the session vars to indicate that edit mode has been closed
        Session.set('topicEditTopicId', null);
    },

    'show.bs.modal #dlgAddTopic': function (evt) {
        const topic = getEditTopic();

        if ((topic._topicDoc.isEditedBy != undefined && topic._topicDoc.isEditedDate != undefined)) {
            let unset = function () {
                IsEditedService.removeIsEditedTopic(_minutesID, topic._topicDoc._id);
                $('#dlgAddTopic').modal('show');
            };

            let user = Meteor.users.findOne({_id: topic._topicDoc.isEditedBy});

            let tmplData = {
                isEditedBy: user.username,
                isEditedDate: topic._topicDoc.isEditedDate
            };

            ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                unset,
                'Edit despite existing editing',
                'confirmationDialogResetEdit',
                tmplData,
                'Edit anyway'
            ).show();

            evt.preventDefault();
            return;
        }
        else {
            IsEditedService.setIsEditedTopic(_minutesID, topic._topicDoc._id);
        }

        configureSelect2Responsibles();
        let selectLabels = $('#id_item_selLabels');
        if (selectLabels) {
            selectLabels.val([]).trigger('change');
        }
        configureSelect2Labels(_minutesID, '#id_item_selLabels', getEditTopic());
        let saveButton = $('#btnTopicSave');
        let cancelButton = $('#btnTopicCancel');
        saveButton.prop('disabled',false);
        cancelButton.prop('disabled',false);
    },

    'shown.bs.modal #dlgAddTopic': function (evt, tmpl) {
        $('#dlgAddTopic').find('input').trigger('change');    // ensure new values trigger placeholder animation
        tmpl.find('#id_subject').focus();
    },

    'click #btnTopicCancel, .close': function (evt) {
        evt.preventDefault();

        const topic = getEditTopic();
        IsEditedService.removeIsEditedTopic(_minutesID, topic._topicDoc._id);

        $('#dlgAddTopic').modal('hide');
    },

    'select2:selecting #id_selResponsible'(evt) {
        console.log('selecting:'+evt.params.args.data.id + '/'+evt.params.args.data.text);
    },

    'select2:select #id_selResponsible'(evt) {
        let respId = evt.params.data.id;
        let respName = evt.params.data.text;
        let aUser = Meteor.users.findOne(respId);
        if (! aUser && respId === respName) {    // we have a free-text user here!
            _meetingSeries.addAdditionalResponsible(respName);
            _meetingSeries.save();
        }
    }
});
