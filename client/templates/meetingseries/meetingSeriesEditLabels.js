import { ColorHelper } from "/imports/ColorHelper";
import { Label } from "/imports/label";
import { MeetingSeries } from "/imports/meetingseries";
import { $ } from "meteor/jquery";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { addCustomValidator } from "../../helpers/customFieldValidator";

let initColorPicker = (selector) => {
  setTimeout(function () {
    $(selector).pickAColor({
      showSavedColors: false,
      showAdvanced: false,
      inlineDropdown: false,
    });
    $(".hex-pound").hide();
  }, 50);
};

Template.meetingSeriesEditLabels.onRendered(function () {
  initColorPicker(".pick-a-color");

  addCustomValidator(
    ".label-color-field",
    (value) => {
      return ColorHelper.isValidHexColorString(value);
    },
    i18n.__("MeetingSeries.Labels.Error.hexValue"),
  );
});

Template.meetingSeriesEditLabels.helpers({
  getColorNum: function () {
    return this.color.substr(1);
  },

  getLabels: function () {
    let aSeries = new MeetingSeries(this.meetingSeriesId);
    return aSeries.getAvailableLabels().map((labelDoc) => {
      let labelObj = new Label(labelDoc);
      labelDoc.fontColor = labelObj.hasDarkBackground() ? "#ffffff" : "#000000";

      return labelDoc;
    });
  },
});

function submitLabelForm(tmpl, context) {
  let labelId = context._id;
  // Unfortunately the form.submit()-function does not trigger the
  // validation process
  tmpl.$(`#form-label-${labelId}`).find(":submit").click();
}

function saveLabel(tmpl, context) {
  let labelId = context._id;
  let row = tmpl.$(`#row-label-${labelId}`);
  row.find(".view-display").show();
  row.find(".view-edit").hide();

  let labelName = row.find("[name='labelName']").val();
  let labelColor = row.find(`[name='labelColor-${labelId}']`).val();

  if (labelColor.substr(0, 1) !== "#") {
    labelColor = `#${labelColor}`;
  }

  let labelDoc = {
    _id: labelId,
    name: labelName,
    color: labelColor,
  };

  let label = new Label(labelDoc);
  label.save(tmpl.data.meetingSeriesId);
}

Template.meetingSeriesEditLabels.events({
  "click .evt-btn-edit-label": function (evt, tmpl) {
    evt.preventDefault();
    let labelId = this._id;
    let row = tmpl.$(`#row-label-${labelId}`);
    row.find(".view-display").hide();
    row.find(".view-edit").show();
    row.find("[name='labelName']").focus();
  },

  "click .evt-btn-edit-cancel": function (evt, tmpl) {
    evt.preventDefault();
    let labelId = this._id;
    let row = tmpl.$(`#row-label-${labelId}`);

    // reset the values
    let aLabel = Label.createLabelById(tmpl.data.meetingSeriesId, labelId);
    let labelName = row.find("[name='labelName']");
    let labelColor = row.find(`[name='labelColor-${labelId}']`);
    labelName.val(aLabel.getName());
    labelColor.val(aLabel.getColor().substr(1));
    labelColor.focus();
    labelName.focus();

    row.find(".view-display").show();
    row.find(".view-edit").hide();
  },

  "submit .label-form": function (evt, tmpl) {
    evt.preventDefault();
    saveLabel(tmpl, this);
  },

  "keyup .evt-submit-enter"(evt, tmpl) {
    // escape key will not be handled in keypress callback...
    if (evt.which === 27 /*escape*/) {
      let labelId = this._id;
      let row = tmpl.$(`#row-label-${labelId}`);
      row.find(".view-display").show();
      row.find(".view-edit").hide();
    }
  },

  "click .evt-btn-edit-save": function (evt, tmpl) {
    evt.preventDefault();
    submitLabelForm(tmpl, this);
  },

  "click .evt-btn-delete-label": function (evt, tmpl) {
    evt.preventDefault();
    let labelId = this._id;
    let aSeries = new MeetingSeries(tmpl.data.meetingSeriesId);
    aSeries.removeLabel(labelId);
    aSeries.save();
  },

  "click .evt-btn-add-label": function (evt, tmpl) {
    evt.preventDefault();
    let labelDoc = {
      name: i18n.__("MeetingSeries.Labels.new"),
      color: "#cccccc",
    };

    let label = new Label(labelDoc);
    label.save(tmpl.data.meetingSeriesId);
    // Add Color Picker to the new label.
    initColorPicker(".pick-a-color:nth-child(1)");
  },
});
