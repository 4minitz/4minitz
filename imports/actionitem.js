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

    invalidateIsNewFlag() {
        this._infoItemDoc.isNew = false;
    }

    isSticky() {
        return this._infoItemDoc.isOpen;
    }

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

    hasResponsibles() {
        return (this._infoItemDoc.responsibles && this._infoItemDoc.responsibles.length);
    }

    getResponsibleRawArray() {
        if (!this.hasResponsibles()) {
            return [];
        }
        return this._infoItemDoc.responsibles;
    }

    getResponsibleEMailArray() {

    }


    getResponsibleNameString() {
        if (!this.hasResponsibles()) {
            return "";
        }

        let responsibles = this._infoItemDoc.responsibles;
        let responsiblesString = "";
        for (let i in responsibles) {
            let userNameFromDB = "";
            if (responsibles[i].length > 15) {  // maybe DB Id or free text
                let user = Meteor.users.findOne(responsibles[i]);
                if (user) {
                    userNameFromDB = user.username;
                }
            }
            if (userNameFromDB) {     // user DB match!
                responsiblesString += userNameFromDB + ", ";
            } else {
                responsiblesString += responsibles[i] + ", ";
            }
        }
        responsiblesString = responsiblesString.slice(0, -2);   // remove last ", "
        return responsiblesString;
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
