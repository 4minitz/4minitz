/**
 * Created by wok on 19.04.16.
 */

import { Minutes } from './minutes';

export class Topic {
    constructor(parentMinutesID, source) {   // constructs obj from Topic ID or Topic document
        if (!parentMinutesID || !source)
            return;

        this._parentMinutes = undefined;
        this._topicDoc = undefined;     // keep separate, no _.extend to prevent storage recursion

        if (typeof parentMinutesID === 'string') {   // we may have an ID here.
            this._parentMinutes = Minutes.findOne(parentMinutesID);
        }
        if (!this._parentMinutes) {
            return;
        }

        if (typeof source === 'string') {   // we may have an ID here.
            source = this._parentMinutes.findTopic(source);
        }
        if (source.isOpen == undefined) {
            source.isOpen = true;
        }
        this._topicDoc = source;
    }

    // ################### static methods
    static findTopicIndexInArray(id, topics) {
        let i;
        for (i = 0; i < topics.length; i++) {
            if (id === topics[i]._id) {
                return i;
            }
        }
        return undefined;
    }

    // ################### object methods
    getDateFromDetails () {
        let details = this._topicDoc.details;
        if (details.length > 0 && details[0].hasOwnProperty("date")) {
            return details[0].date;
        }
        return false;
    }

    getTextFromDetails () {
        let details = this._topicDoc.details;
        if (details.length > 0 && details[0].hasOwnProperty("text")) {
            return details[0].text;
        }
        return "";
    }

    toString () {
        return "Topic: "+JSON.stringify(this._topicDoc, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    save(callback) {
        this._parentMinutes.upsertTopic(this._topicDoc, callback);
    }

    toggleState () {    // open/close
        this._topicDoc.isOpen = !this._topicDoc.isOpen;
    }
}
