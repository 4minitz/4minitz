import { Meteor } from 'meteor/meteor';

import { InfoItem } from './infoitem';

export class ActionItem extends InfoItem{
    constructor(parentTopic, source) {   // constructs obj from item ID or document
        super(parentTopic, source);

        this._infoItemDoc.itemType = 'actionItem';

        if (this._infoItemDoc.isOpen === undefined) {
            this._infoItemDoc.isOpen = true;
        }
        if (this._infoItemDoc.responsible === undefined) {
            this._infoItemDoc.responsible = '';
        }
        if (this._infoItemDoc.priority === undefined) {
            this._infoItemDoc.priority = '';
        }
    }

    // ################### object methods

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
        if (details.length > index && details[index].hasOwnProperty('date')) {
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
        if (details && details.length > 0 && details[index].hasOwnProperty('text')) {
            return details[index].text;
        }
        return '';
    }

    /**
     * Checks whether this topic has associated responsibles
     * or not. This method must have the same name as the
     * topic.hasResponsibles method.
     *
     * @return {boolean}
     */
    hasResponsibles() {
        return (this._infoItemDoc.responsibles && this._infoItemDoc.responsibles.length);
    }
    /**
     * Returns all responsibles associated with this
     * topic. This method must have the same name as the
     * topic.getResponsibles method.
     *
     * @return {Array}
     */
    getResponsibles() {
        return this._infoItemDoc.responsibles;
    }

    getResponsibleRawArray() {
        if (!this.hasResponsibles()) {
            return [];
        }
        return this._infoItemDoc.responsibles;
    }

    // this should only be called from server.
    // because EMails are not propagated to the client!
    getResponsibleEMailArray() {
        if (Meteor.isServer) {
            if (!this.hasResponsibles()) {
                return [];
            }

            let responsibles = this._infoItemDoc.responsibles;
            let mailArray = [];
            responsibles.forEach(responsible => {
                let userEMailFromDB = '';
                let userNameFromDB = '';
                if (responsible.length > 15) {  // maybe DB Id or free text
                    let user = Meteor.users.findOne(responsible);
                    if (user) {
                        userNameFromDB = user.username;
                        if (user.emails && user.emails.length) {
                            userEMailFromDB = user.emails[0].address;
                        }
                    }
                }
                if (userEMailFromDB) {     // user DB match!
                    mailArray.push(userEMailFromDB);
                } else {
                    let freetextMail = responsible.trim();
                    if (/\S+@\S+\.\S+/.test(freetextMail)) {    // check valid mail anystring@anystring.anystring
                        mailArray.push(freetextMail);
                    } else {
                        console.log('WARNING: Invalid mail address for responsible: >'+freetextMail+'< '+userNameFromDB);
                    }
                }
            });
            return mailArray;
        }
        return [];
    }


    getResponsibleNameString() {
        if (!this.hasResponsibles()) {
            return '';
        }

        let responsibles = this._infoItemDoc.responsibles;
        let responsiblesString = '';
        responsibles.forEach(responsible => {
            let userNameFromDB = '';
            if (responsible.length > 15) {  // maybe DB Id or free text
                let user = Meteor.users.findOne(responsible);
                if (user) {
                    userNameFromDB = user.username;
                }
            }
            if (userNameFromDB) {     // user DB match!
                responsiblesString += userNameFromDB + ', ';
            } else {
                responsiblesString += responsible + ', ';
            }
        });
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
