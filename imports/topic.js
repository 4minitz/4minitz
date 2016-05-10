/**
 * Created by wok on 19.04.16.
 */

import { Minutes } from './minutes';

/**
 * A Topic is an Agenda Topic which can
 * have multiple sub-items called TopicItem.
 */
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
        if (source.isNew == undefined) {
            source.isNew = true;
        }
        this._topicDoc = source;

        if (!this._topicDoc.topicItems) {
            this._topicDoc.topicItems = [];
        }
    }

    // ################### static methods
    static findTopicIndexInArray(id, topics) {
        return subElementsHelper.findIndexById(id, topics);
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

    upsertTopicItem(topicItemDoc) {
        let i = undefined;
        if (! topicItemDoc._id) {             // brand-new topicItem
            topicItemDoc._id = Random.id();   // create our own local _id here!
        } else {
            i = subElementsHelper.findIndexById(topicItemDoc._id, this.getTopicItems())
        }
        if (i == undefined) {                      // topicItem not in array
            this.getTopicItems().unshift(topicItemDoc);  // add to front of array
        } else {
            this.getTopicItems()[i] = topicItemDoc;      // overwrite in place
        }

        this.save();
    }


    removeTopicItem(id) {
        let i = subElementsHelper.findIndexById(id, this.getTopicItems());
        if (i != undefined) {
            this.getTopicItems().splice(i, 1);
            this.save();

        }
    }

    findTopicItem(id) {
        let i = i = subElementsHelper.findIndexById(id, this.getTopicItems());
        if (i != undefined) {
            return this.topics[i];
        }
        return undefined;
    }

    getTopicItems() {
        return this._topicDoc.topicItems;
    }

    save() {
        // this will update the entire topics array from the parent minutes!
        this._parentMinutes.upsertTopic(this._topicDoc);
    }

    toggleState () {    // open/close
        this._topicDoc.isOpen = !this._topicDoc.isOpen;
    }
}
