import {ActionItem} from '../actionitem';
import {InfoItem} from '../infoitem';

export class ItemsConverter {

    static async convertItem(infoOrActionItem) {
        if (infoOrActionItem instanceof ActionItem) {
            infoOrActionItem._infoItemDoc.itemType = 'infoItem';
        } else if (infoOrActionItem instanceof InfoItem) {
            infoOrActionItem._infoItemDoc.itemType = 'actionItem';
        }
        await infoOrActionItem.save();
    }

    static isConversionAllowed(itemDoc, currentMinutesId) {
        return itemDoc.createdInMinute === currentMinutesId;
    }
}