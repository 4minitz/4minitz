import { Meteor } from "meteor/meteor";

import { ActionItem } from "../../../../imports/actionitem";
import { extractDateFromString } from "../../../../imports/helpers/date";
import { StringUtils } from "../../../../imports/helpers/string-utils";
import { InfoItem } from "../../../../imports/infoitem";
import { Priority } from "../../../../imports/priority";
import { LabelExtractor } from "../../../../imports/services/labelExtractor";
import { ResponsibleExtractor } from "../../../../imports/services/responsibleExtractor";

import { convertOrCreateLabelsFromStrings } from "./convert-or-create-label-from-string";

export function createItem(
  itemDoc,
  parentTopic,
  minutesId,
  meetingSeries,
  type = "infoItem",
  labels = [],
) {
  itemDoc.labels = convertOrCreateLabelsFromStrings(labels, meetingSeries);

  if (!itemDoc.createdInMinute) {
    itemDoc.createdInMinute = minutesId;
  }

  if (!itemDoc.subject) {
    throw new Meteor.Error(
      "illegal-argument",
      "Please add a subject for the new item",
    );
  }

  let newItem;
  switch (type) {
    case "actionItem": {
      // extract duedate
      const duedate = extractDateFromString(itemDoc.subject);
      if (duedate) {
        itemDoc.duedate = duedate;
        itemDoc.subject = StringUtils.eraseSubstring(itemDoc.subject, duedate);
      }
      // extract priority
      const prio = Priority.extractPriorityFromString(itemDoc.subject);
      if (prio) {
        itemDoc.priority = prio.value;
        itemDoc.subject = StringUtils.eraseSubstring(itemDoc.subject, duedate);
      }

      newItem = new ActionItem(parentTopic, itemDoc);
      if (itemDoc.priority) {
        newItem.setPriority(new Priority(itemDoc.priority));
      }
      break;
    }
    case "infoItem": {
      newItem = new InfoItem(parentTopic, itemDoc);
      break;
    }
    default:
      throw new Meteor.Error("Unknown type!");
  }

  const labelExtractor = new LabelExtractor(itemDoc.subject, meetingSeries._id);
  newItem.addLabelsById(labelExtractor.getExtractedLabelIds());
  newItem.setSubject(labelExtractor.getCleanedString());

  return newItem;
}

export function detectTypeAndCreateItem(
  itemDoc,
  parentTopic,
  minutesId,
  meetingSeries,
) {
  const responsibleExtractor = new ResponsibleExtractor(itemDoc.subject, true);
  let type = "infoItem";
  const extractedResponsible = responsibleExtractor.getExtractedResponsible();
  if (extractedResponsible.length > 0) {
    type = "actionItem";
    itemDoc.responsibles = itemDoc.responsibles || [];
    itemDoc.responsibles = itemDoc.responsibles.concat(extractedResponsible);
    itemDoc.subject = responsibleExtractor.getCleanedString();
  }
  return createItem(itemDoc, parentTopic, minutesId, meetingSeries, type);
}
