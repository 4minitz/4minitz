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
        this._topicDoc = source;
    }

    toString () {
        return "Topic: "+JSON.stringify(this._topicDoc, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    save() {
        this._parentMinutes.upsertTopic(this._topicDoc);
    }

    toggleState () {    // open/close
        this._topicDoc.isOpen = !this._topicDoc.isOpen;
    }
}
