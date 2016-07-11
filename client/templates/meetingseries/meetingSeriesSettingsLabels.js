import { Meteor } from 'meteor/meteor';

import { addCustomValidator } from '../../helpers/customFieldValidator'

import { MeetingSeries } from '/imports/meetingseries'
import { Label } from '/imports/label'

import { ColorHelper } from '/imports/ColorHelper'

Template.meetingSeriesSettingsLabels.onRendered(function () {
    addCustomValidator(
        ".label-color-field",
        (value) => { return ColorHelper.isValidHexColorString(value) },
        'Invalid hex color value');

    Meteor.setTimeout(function() {
        $('.pick-a-color').pickAColor();
        $('.hex-pound').hide();
    }, 50);
});

Template.meetingSeriesSettingsLabels.helpers({
    count: function (labels) {
        return labels.length;
    },

    getColorNum: function() {
        return this.color.substr(1);
    },

    getLabels: function () {
        let aSeries = new MeetingSeries(this.meetingSeriesId);
        return aSeries.getAvailableLabels().map(labelDoc => {
            let labelObj = new Label(labelDoc);
            labelDoc.fontColor = labelObj.hasDarkBackground() ? '#ffffff' : '#000000';

            return labelDoc;
        });
    }
});

function submitLabelForm(tmpl, context) {
    let labelId = context._id;
    // Unfortunately the form.submit()-function does not trigger the
    // validation process
    tmpl.$('#form-label-' + labelId).find(':submit').click();
}

function saveLabel(tmpl, context) {
    let labelId = context._id;
    let row = tmpl.$('#row-label-' + labelId);
    row.find('.view-display').show();
    row.find('.view-edit').hide();

    let labelName = row.find("[name='labelName']").val();
    let labelColor = row.find("[name='labelColor-" + labelId + "']").val();

    if (labelColor.substr(0, 1) !== '#') {
        labelColor = '#' + labelColor;
    }

    let labelDoc = {
        _id: labelId,
        name: labelName,
        color: labelColor
    };

    let label = new Label(labelDoc);
    label.save(tmpl.data.meetingSeriesId);
}

Template.meetingSeriesSettingsLabels.events({

    'click .evt-btn-edit-label': function(evt, tmpl) {
        evt.preventDefault();
        let labelId = this._id;
        let row = tmpl.$('#row-label-' + labelId);
        row.find('.view-display').hide();
        row.find('.view-edit').show();
        row.find("[name='labelName']").focus();

    },

    'click .evt-btn-edit-cancel': function(evt, tmpl) {
        evt.preventDefault();
        let labelId = this._id;
        let row = tmpl.$('#row-label-' + labelId);
        row.find('.view-display').show();
        row.find('.view-edit').hide();
    },

    'submit .label-form': function(evt, tmpl) {
        evt.preventDefault();
        saveLabel(tmpl, this);
    },

    'keyup .evt-submit-enter'(evt, tmpl) {
        // escape key will not be handled in keypress callback...
        if (event.which === 27/*escape*/) {
            let labelId = this._id;
            let row = tmpl.$('#row-label-' + labelId);
            row.find('.view-display').show();
            row.find('.view-edit').hide();
        }
    },
/*
    'keyup .label-color-field'(evt) {
        let field = evt.currentTarget;
        if (field.value === '') {
            field.value = '#';
        }
    },
*/
    'click .evt-btn-edit-save': function(evt, tmpl) {
        evt.preventDefault();
        submitLabelForm(tmpl, this);
    },

    'click .evt-btn-delete-label': function(evt, tmpl) {
        evt.preventDefault();
        let labelId = this._id;
        let aSeries = new MeetingSeries(tmpl.data.meetingSeriesId);
        aSeries.removeLabel(labelId);
        aSeries.save();
    }
});