import { InfoItem } from './infoitem';
import { ActionItem } from './actionitem';


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
        if (InfoItem.isActionItem(infoItemDoc)) {
            return new ActionItem(parentTopic, infoItemDoc);
        } else {
            return new InfoItem(parentTopic, infoItemDoc);
        }
    }

}
