import { Minutes } from './minutes';
import { InfoItemFactory } from './InfoItemFactory';
import { InfoItem } from './infoitem';
import { _ } from 'meteor/underscore';


function resolveParentElement(minutes) {
    if (typeof minutes === 'string') {
        return Minutes.findOne(minutes);
    }

    if ((typeof minutes === 'object') && ( typeof minutes.upsertTopic === 'function' )) {
        return minutes;
    }

    throw new Meteor.Error('Runtime error, illegal parent element');
}

function resolveTopic(parentElement, source) {
    if (typeof source === 'string') {
        if (typeof parentElement.findTopic !== 'function') {
            throw new Meteor.Error('Runtime error, illegal parent element');
        }

        source = parentElement.findTopic(source);
        if (!source) {
            throw new Meteor.Error("Runtime Error, could not find topic!");
        }
    }

    _.defaults(source, {
        isOpen: true,
        isNew: true
    });

    return source;
}

/**
 * A Topic is an Agenda Topic which can
 * have multiple sub-items called InfoItem.
 */
export class Topic {

    /**
     *
     * @param parentElement {string|object} is either the id of the parent minute
     *                      or the parent object which has at least the methods upsertTopic() and findTopic().
     *                      So the parent object could be both a minute or a meeting series.
     * @param source        {string|object} topic_id then the document will be fetched from the parentMinute
     *                      or a topic object
     */
    constructor(parentElement, source) {
        if (!parentElement || !source) {
            return;
        }

        this._parentMinutes = resolveParentElement(parentElement);
        if (!this._parentMinutes) {
            return;
        }

        this._topicDoc = resolveTopic(this._parentMinutes, source);

        if (!Array.isArray(this._topicDoc.infoItems)) {
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
        targetTopicDoc.isNew = sourceTopicDoc.isNew;
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
