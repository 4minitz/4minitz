import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { Label } from '/imports/label'



Template.meetingSeriesSettingsLabels.helpers({
    count: function (labels) {
        return labels.length;
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

function saveLabel(tmpl, context) {
    let labelId = context._id;
    let row = tmpl.$('#row-label-' + labelId);
    row.find('.view-display').show();
    row.find('.view-edit').hide();

    let labelName = row.find("[name='labelName']").val();
    let labelColor = row.find("[name='labelColor']").val();

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

    'keypress .evt-submit-enter'(evt, tmpl) {
        if (event.which === 13/*enter*/) {
            evt.preventDefault();
            saveLabel(tmpl, this);
        }
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

    'click .evt-btn-edit-save': function(evt, tmpl) {
        evt.preventDefault();
        saveLabel(tmpl, this);
    },

    'click .evt-btn-delete-label': function(evt, tmpl) {
        evt.preventDefault();
        let labelId = this._id;
        let aSeries = new MeetingSeries(tmpl.data.meetingSeriesId);
        aSeries.removeLabel(labelId);
        aSeries.save();
    }
});