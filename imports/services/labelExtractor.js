/**
 * Extracts labels from strings.
 * Labels will be recognized if they:
 *  * start with a # and
 *  * can be matched to a already existing label
 *    or they do not start with a number and do not contain white spaces
 */
import { MeetingSeriesSchema } from "../collections/meetingseries.schema";
import { StringUtils } from "../helpers/string-utils";
import { Label } from "../label";

export class LabelExtractor {
  constructor(string, meetingSeriesId) {
    this.string = string;
    this.meetingSeriesId = meetingSeriesId;
    this.availableLabels = [];
    this.extractedLabelIds = [];

    this._loadLabelsFromSeries();
    this._extractLabels();
  }

  getExtractedLabelIds() {
    return this.extractedLabelIds;
  }

  getCleanedString() {
    return this.string;
  }

  _loadLabelsFromSeries() {
    const series = MeetingSeriesSchema.findOne(this.meetingSeriesId);
    this.availableLabels = series.availableLabels;
  }

  _extractLabels() {
    this._extractExistingLabels();
    this._extractAndCreatedNewLabels();
  }

  _extractExistingLabels() {
    this.availableLabels.forEach((label) => {
      const labelString = `#${label.name}`;
      if (this.string.indexOf(labelString) !== -1) {
        this._addLabel(label);
      }
    });
  }

  _extractAndCreatedNewLabels() {
    const regEx = /(^|[\s.,;])#([a-zA-Z]+[^\s.,;]*)/g;
    const completeString = this.string;
    let match;

    while ((match = regEx.exec(completeString)) !== null) {
      const labelName = match[2];
      this._addLabelByName(labelName);
      this._removeLabelFromString(labelName);
    }
  }

  _addLabelByName(labelName) {
    let label = Label.createLabelByName(this.meetingSeriesId, labelName);
    if (label === null) {
      label = new Label({ name: labelName });
      label.save(this.meetingSeriesId);
    }
    this._addLabel(label.getDocument());
  }

  _addLabel(label) {
    this.extractedLabelIds.push(label._id);
    this._removeLabelFromString(label.name);
  }

  _removeLabelFromString(labelName) {
    this.string = StringUtils.eraseSubstring(this.string, `#${labelName}`);
  }
}
