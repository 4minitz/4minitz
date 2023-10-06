import { Label } from "../label";

export class LabelResolver {
  static resolveLabels(labelIds, meetingSeriesId) {
    if (!labelIds) {
      return [];
    }
    return labelIds
      .map((labelId) => Label.createLabelById(meetingSeriesId, labelId))
      .filter((label) => label !== null);
  }

  static resolveAndformatLabelsString(labelIds, meetingSeriesId) {
    const labels = LabelResolver.resolveLabels(labelIds, meetingSeriesId);
    return labels.map((label) => `#${label.getName()}`).join(", ");
  }
}
