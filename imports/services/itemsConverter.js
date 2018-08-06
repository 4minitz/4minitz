import {ActionItem} from '../actionitem';
import {InfoItem} from '../infoitem';

export class ItemsConverter {

    static async convertItem(infoOrActionItem) {
        if (infoOrActionItem instanceof ActionItem) {
            infoOrActionItem._infoItemDoc.itemType = 'infoItem';
            infoOrActionItem._infoItemDoc.isOpen = undefined;
            
        } else if (infoOrActionItem instanceof InfoItem) {
            infoOrActionItem._infoItemDoc.itemType = 'actionItem';

            // If optional isOpen attribute is not yet available, we must set it to true,
            // otherwise the AI will be considered "done" immediately after conversion.
            // So, a "done" state is preserved when converting back-and-forth.
            if (infoOrActionItem._infoItemDoc.isOpen === undefined) {
                infoOrActionItem._infoItemDoc.isOpen = true;
            }
            // As the isSticky attribute is not optional, and action items
            // are not allowed to have isSticky attribute, we set it to false here, without condition.
            // So, the isSticky state is lost when converting back-and-forth
            infoOrActionItem._infoItemDoc.isSticky = false;
        }
        await infoOrActionItem.save();
    }

    static isConversionAllowed(itemDoc, currentMinutesId) {
        return itemDoc.createdInMinute === currentMinutesId;
    }
}
