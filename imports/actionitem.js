/**
 * Created by felix on 09.05.16.
 */


import { TopicItem } from './topcitem';

export class ActionItem extends TopicItem{
    constructor(parentTopic, source) {   // constructs obj from Topic ID or Topic document
        if (source.isOpen == undefined) {
            source.isOpen = true;
        }

        super(parentTopic, source);
    }

    // ################### object methods
    getDateFromDetails () {
        let details = this._topicItemDoc.details;
        if (details.length > 0 && details[0].hasOwnProperty("date")) {
            return details[0].date;
        }
        return false;
    }

    getTextFromDetails () {
        let details = this._topicItemDoc.details;
        if (details.length > 0 && details[0].hasOwnProperty("text")) {
            return details[0].text;
        }
        return "";
    }

    toggleState () {    // open/close
        this._topicItemDoc.isOpen = !this._topicItemDoc.isOpen;
    }
}
