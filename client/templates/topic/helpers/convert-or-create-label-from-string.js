import { Label } from "../../../../imports/label";

export const convertOrCreateLabelsFromStrings = (labels, series) => {
  return labels.map((labelId) => {
    let label = Label.createLabelById(series, labelId);
    if (label === null) {
      // we have no such label -> it's brand new
      label = new Label({ name: labelId });
      label.save(series._id);
    }
    return label.getId();
  });
};
