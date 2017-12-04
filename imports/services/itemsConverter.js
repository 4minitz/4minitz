import {ActionItem} from '../actionitem';
import {InfoItem} from '../infoitem';

export class ItemsConverter {

    static async convertItem(infoOrActionItem) {
        if (infoOrActionItem instanceof ActionItem) {
            await ItemsConverter.convertActionToInfoItem(infoOrActionItem);
        } else if (infoOrActionItem instanceof InfoItem) {
            await ItemsConverter.convertInfoToActionItem(infoOrActionItem);
        }
    }

    static async convertInfoToActionItem(infoItem) {
        infoItem._infoItemDoc.itemType = 'actionItem';
        const convertedActionItem = new ActionItem(infoItem.getParentTopic(), infoItem.getDocument());
        await convertedActionItem.save();

    }

    static async convertActionToInfoItem(actionItem) {
        actionItem._infoItemDoc.itemType = 'infoItem';
        const convertedInfoItem = new InfoItem(actionItem.getParentTopic(), actionItem.getDocument());
        await convertedInfoItem.save();
    }

    static isConversionAllowed(itemDoc, currentMinutesId) {
        return itemDoc.createdInMinute === currentMinutesId;
    }
}