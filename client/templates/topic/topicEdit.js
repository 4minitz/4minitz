import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { Topic } from '/imports/topic';
import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { Label } from '/imports/label';
import { ResponsiblePreparer } from '/imports/client/ResponsiblePreparer';
import { $ } from 'meteor/jquery';
import { handleError } from '/client/helpers/handleError';
import {createTopic} from './helpers/create-topic';

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

function configureSelect2Labels() {
    let aMin = new Minutes(_minutesID);
    let aSeries = aMin.parentMeetingSeries();

    let selectLabels = $('#id_item_selLabels');
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
    let editItem = getEditTopic();
    if (editItem) {
        selectLabels.val(editItem.getLabelsRawArray());
    }
    selectLabels.trigger('change');
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
            _.extend(topicDoc, editTopic._topicDoc);
        }

        let labels = tmpl.$('#id_item_selLabels').val();
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

    'show.bs.modal #dlgAddTopic': function () {
        configureSelect2Responsibles();
        let selectLabels = $('#id_item_selLabels');
        if (selectLabels) {
            selectLabels.val([]).trigger('change');
        }
        configureSelect2Labels();
        let saveButton = $('#btnTopicSave');
        let cancelButton = $('#btnTopicCancel');
        saveButton.prop('disabled',false);
        cancelButton.prop('disabled',false);
    },

    'shown.bs.modal #dlgAddTopic': function (evt, tmpl) {
        $('#dlgAddTopic').find('input').trigger('change');    // ensure new values trigger placeholder animation
        tmpl.find('#id_subject').focus();
        configureSelect2Labels();
    },

    'select2:selecting #id_selResponsible'(evt) {
        console.log('selecting:'+evt.params.args.data.id + '/'+evt.params.args.data.text);
    },

    'select2:select #id_selResponsible'(evt) {
        console.log('select:'+evt.params.data.id + '/'+evt.params.data.text);
        let respId = evt.params.data.id;
        let respName = evt.params.data.text;
        let aUser = Meteor.users.findOne(respId);
        if (! aUser && respId === respName) {    // we have a free-text user here!
            _meetingSeries.addAdditionalResponsible(respName);
            _meetingSeries.save();
        }
    }
});
