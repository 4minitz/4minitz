/**
 * Created by felix on 09.05.16.
 */


import { InfoItem } from './infoitem';

export class ActionItem extends InfoItem{
    constructor(parentTopic, source) {   // constructs obj from item ID or document
        super(parentTopic, source);

        this._infoItemDoc.itemType = 'actionItem';

        if (this._infoItemDoc.isOpen == undefined) {
            this._infoItemDoc.isOpen = true;
        }
        if (this._infoItemDoc.isNew == undefined) {
            this._infoItemDoc.isNew = true;
        }
        if (this._infoItemDoc.responsible == undefined) {
            this._infoItemDoc.responsible = "";
        }
        if (this._infoItemDoc.priority == undefined) {
            this._infoItemDoc.priority = "";
        }
    }

    // ################### object methods

    /**
     * Gets the date of the detail item
     * at the given index.
     *
     * @param index position in the details array (0 if undefined)
     * @returns {boolean|string} false (if date is not given) or date as ISO8601 string.
     */
    getDateFromDetails (index) {
        if (index === undefined) index = 0;
        let details = this._infoItemDoc.details;
        if (details.length > index && details[index].hasOwnProperty("date")) {
            return details[index].date;
        }
        return false;
    }

    /**
     * Gets the text of the detail item
     * at the given index.
     *
     * @param index position in the details array (0 if undefined)
     * @returns {string}
     */
    getTextFromDetails (index) {
        if (index === undefined) index = 0;
        let details = this._infoItemDoc.details;
        if (details.length > 0 && details[index].hasOwnProperty("text")) {
            return details[index].text;
        }
        return "";
    }

    addDetails(text) {
        if (text === undefined) text = "";

        let date = formatDateISO8601(new Date());
        this._infoItemDoc.details.push({
            date: date,
            text: text
        })
    }

    getDetails() {
        return this._infoItemDoc.details;
    }

    getSubject() {
        return this._infoItemDoc.subject;
    }

    getResponsibleArray() {
        if (!this._infoItemDoc.responsible) {
            return [];
        }
        // currently we store the responsible persons as a comma separated string
        return this._infoItemDoc.responsible.split(',');
    }

    getResponsibleString() {
        return this._infoItemDoc.responsible;
    }

    getPriority() {
        let prio = this._infoItemDoc.priority;
        return (prio) ? prio : '';
    }

    getDuedate() {
        return this._infoItemDoc.duedate;
    }

    toggleState () {    // open/close
        this._infoItemDoc.isOpen = !this._infoItemDoc.isOpen;
    }
}
