/**
 * Created by wok on 19.04.16.
 */

import { Minutes } from './minutes';
import { InfoItemFactory } from './InfoItemFactory';
import { InfoItem } from './infoitem';

/**
 * A Topic is an Agenda Topic which can
 * have multiple sub-items called InfoItem.
 */
export class Topic {
    constructor(parentMinutes, source) {   // constructs obj from Topic ID or Topic document
        if (!parentMinutes || !source)
            return;

        this._parentMinutes = undefined;
        this._topicDoc = undefined;     // keep separate, no _.extend to prevent storage recursion

        if (typeof parentMinutes === 'string') {   // we may have an ID here.
            this._parentMinutes = Minutes.findOne(parentMinutes);
        }
        if ((typeof parentMinutes === 'object') && (parentMinutes instanceof Minutes)) {
            this._parentMinutes = parentMinutes;
        }
        if (!this._parentMinutes) {
            return;
        }

        if (typeof source === 'string') {   // we may have an ID here.
            source = this._parentMinutes.findTopic(source);
            if (!source) {
                throw new Meteor.Error("Runtime Error, could not find topic!");
            }
        }
        if (source.isOpen == undefined) {
            source.isOpen = true;
        }
        if (source.isNew == undefined) {
            source.isNew = true;
        }
        this._topicDoc = source;

        if (!this._topicDoc.infoItems) {
            this._topicDoc.infoItems = [];
        }
    }

    // ################### static methods
    static findTopicIndexInArray(id, topics) {
        return subElementsHelper.findIndexById(id, topics);
    }

    /**
     * Checks if the given topic document
     * has at least one open ActionItem.
     *
     * @param topicDoc document of a topic
     * @returns {boolean}
     */
    static hasOpenActionItem(topicDoc) {
        let infoItemDocs = topicDoc.infoItems;
        let i;
        for (i = 0; i < infoItemDocs.length; i++) {
            if (infoItemDocs[i].isOpen) {
                return true;
            }
        }
        return false;
    }

    static invalidateIsNewFlag(topicDoc) {
        topicDoc.isNew = false;
        topicDoc.infoItems.forEach(infoItemDoc => {
            if (InfoItem.isActionItem(infoItemDoc) && infoItemDoc.isNew) {
                infoItemDoc.isNew = false;
            }
        })
    }

    /**
     * Overwrites the simple properties (subject, responsible)
     * of the target doc with the properties of the source document.
     *
     * @param sourceTopicDoc
     * @param targetTopicDoc
     * @returns targetTopicDoc
     */
    static overwritePrimitiveProperties(sourceTopicDoc, targetTopicDoc) {
        targetTopicDoc.subject = sourceTopicDoc.subject;
        targetTopicDoc.responsible = sourceTopicDoc.responsible;
        return targetTopicDoc;
    }

    // ################### object methods
    toString () {
        return "Topic: "+JSON.stringify(this._topicDoc, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    upsertInfoItem(topicItemDoc, callback) {
        let i = undefined;
        if (! topicItemDoc._id) {             // brand-new topicItem
            topicItemDoc._id = Random.id();   // create our own local _id here!
        } else {
            i = subElementsHelper.findIndexById(topicItemDoc._id, this.getInfoItems())
        }
        if (i == undefined) {                      // topicItem not in array
            this.getInfoItems().unshift(topicItemDoc);  // add to front of array
        } else {
            this.getInfoItems()[i] = topicItemDoc;      // overwrite in place
        }

        this.save(callback);
    }


    removeInfoItem(id) {
        let i = subElementsHelper.findIndexById(id, this.getInfoItems());
        if (i != undefined) {
            this.getInfoItems().splice(i, 1);
            this.save();
        }
    }

    /**
     * Removes all fire-and-forget elements as well
     * as closed AIs from this topic (info items which are
     * no action items)
     */
    tailorTopic() {
        this._topicDoc.infoItems = this._topicDoc.infoItems.filter((infoItem) => {
            return InfoItem.isActionItem(infoItem) && infoItem.isOpen;
        });
    }

    /**
     * Finds the InfoItem identified by its
     * id.
     *
     * @param id
     * @returns {undefined|InfoItem|ActionItem}
     */
    findInfoItem(id) {
        let i = subElementsHelper.findIndexById(id, this.getInfoItems());
        if (i != undefined) {
            return InfoItemFactory.createInfoItem(this, this.getInfoItems()[i]);
        }
        return undefined;
    }

    getInfoItems() {
        return this._topicDoc.infoItems;
    }

    getOnlyInfoItems() {
        return this.getInfoItems().filter((item) => {
            return !InfoItem.isActionItem(item);
        })
    }

    getOpenActionItems() {
        return this._topicDoc.infoItems.filter((infoItemDoc) => {
            return InfoItem.isActionItem(infoItemDoc) && infoItemDoc.isOpen;
        });
    }

    getSubject() {
        return this._topicDoc.subject;
    }

    save(callback) {
        // this will update the entire topics array from the parent minutes!
        this._parentMinutes.upsertTopic(this._topicDoc, callback);
    }

    toggleState () {    // open/close
        this._topicDoc.isOpen = !this._topicDoc.isOpen;
    }

    hasOpenActionItem() {
        return Topic.hasOpenActionItem(this._topicDoc);
    }

    getDocument() {
        return this._topicDoc;
    }
}
