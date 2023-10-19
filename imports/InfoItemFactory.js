import { ActionItem } from "./actionitem";
import { InfoItem } from "./infoitem";

export class InfoItemFactory {
  /**
   * Creates a new InfoItem or ActionItem
   * depending on the given infoItemDoc.
   *
   * InfoItems and ActionItems differ by
   * the itemType-property
   *
   * @param parentTopic
   * @param infoItemDoc
   * @returns {InfoItem|ActionItem}
   */
  static createInfoItem(parentTopic, infoItemDoc) {
    return InfoItem.isActionItem(infoItemDoc)
      ? new ActionItem(parentTopic, infoItemDoc)
      : new InfoItem(parentTopic, infoItemDoc);
  }
}
