import { Minutes } from './minutes';
import { MeetingSeries } from './meetingseries';
import { InfoItemFactory } from './InfoItemFactory';
import { InfoItem } from './infoitem';
import { _ } from 'meteor/underscore';


function resolveParentElement(parent) {
    if (typeof parent === 'string') {
        let parentId = parent;
        parent =  MeetingSeries.findOne(parentId);
        if (!parent) parent = Minutes.findOne(parentId);
        return parent;
    }

    if ((typeof parent === 'object') && ( typeof parent.upsertTopic === 'function' )) {
        return parent;
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
     * @param parentElement {string|object} is either the id of the parent minute or parent meeting series
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

    // ################### object methods
    toString () {
        return "Topic: "+JSON.stringify(this._topicDoc, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    invalidateIsNewFlag() {
        this._topicDoc.isNew = false;
        this._topicDoc.infoItems.forEach(infoItemDoc => {
            let infoItem = InfoItemFactory.createInfoItem(this, infoItemDoc);
            infoItem.invalidateIsNewFlag();
        });
    }

    /**
     * Merges all changes of the updateTopicDoc
     * into the current topic doc.
     * This means:
     *  - overwrite the simple properties (subject, responsible)
     *  - add new InfoItems / AIs
     *  - update existing InfoItems / AIs
     *  - delete sticky items which where deleted within the updateTopicDoc
     *
     * @param updateTopicDoc
     */
    merge(updateTopicDoc) {
        this._overwritePrimitiveProperties(updateTopicDoc);
        let myTopicDoc = this._topicDoc;

        // loop backwards through topic items
        for (let i = updateTopicDoc.infoItems.length; i-- > 0;) {
            let infoDoc = updateTopicDoc.infoItems[i];
            this.upsertInfoItem(infoDoc, undefined, false);
        }

        // delete all sticky items listed in the this topic but not in the updateTopicDoc
        // (these were deleted during the last minute)
        myTopicDoc.info = myTopicDoc.infoItems.filter(itemDoc => {
            let item = InfoItemFactory.createInfoItem(this, itemDoc);
            if (item.isSticky()) {
                let indexInMinutesTopicDoc = subElementsHelper.findIndexById(itemDoc._id, updateTopicDoc.infoItems);
                return !(indexInMinutesTopicDoc === undefined);
            }
            return true;
        });
    }

    /**
     * A topic is closed if it is not open
     * and has no more open AIs.
     *
     * @returns {boolean}
     */
    isClosed() {
        return (!this.getDocument().isOpen && !this.hasOpenActionItem());
    }

    upsertInfoItem(topicItemDoc, callback, saveChanges) {
        if (saveChanges === undefined) {
            saveChanges = true;
        }
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

        if (saveChanges) {
            this.save(callback);
        }
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


    // ################### private methods
    /**
     * Overwrites the simple properties (subject, responsible)
     * with the properties of the source document.
     *
     * @param updateTopicDoc
     */
    _overwritePrimitiveProperties(updateTopicDoc) {
        this._topicDoc.subject = updateTopicDoc.subject;
        this._topicDoc.responsible = updateTopicDoc.responsible;
        this._topicDoc.isNew = updateTopicDoc.isNew;
    }
}
