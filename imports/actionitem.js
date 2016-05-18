/**
 * Created by felix on 09.05.16.
 */


import { InfoItem } from './infoitem';

export class ActionItem extends InfoItem{
    constructor(parentTopic, source) {   // constructs obj from item ID or document
        super(parentTopic, source);

        if (this._infoItemDoc.isOpen == undefined) {
            this._infoItemDoc.isOpen = true;
        }
    }

    // ################### object methods
    getDateFromDetails () {
        let details = this._infoItemDoc.details;
        if (details.length > 0 && details[0].hasOwnProperty("date")) {
            return details[0].date;
        }
        return false;
    }

    getTextFromDetails () {
        let details = this._infoItemDoc.details;
        if (details.length > 0 && details[0].hasOwnProperty("text")) {
            return details[0].text;
        }
        return "";
    }

    toggleState () {    // open/close
        this._infoItemDoc.isOpen = !this._infoItemDoc.isOpen;
    }
}
