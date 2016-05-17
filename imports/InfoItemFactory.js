/**
 * Created by felix on 10.05.16.
 */

import { InfoItem } from './infoitem';
import { ActionItem } from './actionitem';


export class InfoItemFactory {

    /**
     * Creates a new InfoItem or ActionItem
     * depending on the given infoItemDoc.
     *
     * InfoItems and ActionItems differ by
     * the availability of the isOpen-Property
     * (only ActionItems have a state!)
     *
     * @param parentTopic
     * @param infoItemDoc
     * @returns {InfoItem|ActionItem}
     */
    static createInfoItem(parentTopic, infoItemDoc) {
        if (InfoItem.isActionItem(infoItemDoc)) {
            // only ActionItems has the isOpen-Property!
            return new ActionItem(parentTopic, infoItemDoc);
        } else {
            return new InfoItem(parentTopic, infoItemDoc);
        }
    }

}