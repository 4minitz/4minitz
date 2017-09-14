/**
 * A Topic is an Agenda Topic which can
 * have multiple sub-items called InfoItem.
 */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { subElementsHelper } from '/imports/helpers/subElements';
import { Minutes } from './minutes';
import { MeetingSeries } from './meetingseries';
import { InfoItemFactory } from './InfoItemFactory';
import { InfoItem } from './infoitem';
import { _ } from 'meteor/underscore';

import './helpers/promisedMethods';
import './collections/minutes_private';


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
            throw new Meteor.Error('Runtime Error, could not find topic!');
        }
    }

    _.defaults(source, {
        isOpen: true,
        isNew: true,
        isRecurring: false,
        labels: [],
        isSkipped: false
    });

    return source;
}

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
        return 'Topic: '+JSON.stringify(this._topicDoc, null, 4);
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
            this.upsertInfoItem(infoDoc, false);
        }

        // delete all sticky items listed in the this topic but not in the updateTopicDoc
        // (these were deleted during the last minute)
        myTopicDoc.infoItems = myTopicDoc.infoItems.filter(itemDoc => {
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
    isClosedAndHasNoOpenAIs() {
        return (!this.getDocument().isOpen && !this.hasOpenActionItem() && !this.isRecurring());
    }

    isDeleteAllowed() {
        return (this.getDocument().createdInMinute === this._parentMinutes._id);
    }

    isRecurring() {
        return this.getDocument().isRecurring;
    }

    toggleRecurring() {
        this.getDocument().isRecurring = !this.isRecurring();
    }
    
    isSkipped() {
        return this.getDocument().isSkipped;
    }
    
    toggleSkip(forceOpenTopic = true) {
        this.getDocument().isSkipped = !this.isSkipped();
        if (forceOpenTopic) {
            if (this.isSkipped() && (!this._topicDoc.isOpen)) { // topic has been set to skip, so it will be automatically set as open
                this.toggleState();
            }
        }
    }

    async upsertInfoItem(topicItemDoc, saveChanges) {
        if (saveChanges === undefined) {
            saveChanges = true;
        }
        let i = undefined;
        if (! topicItemDoc._id) {             // brand-new topicItem
            topicItemDoc._id = Random.id();   // create our own local _id here!
        } else {
            i = subElementsHelper.findIndexById(topicItemDoc._id, this.getInfoItems());
        }
        if (i === undefined) {                      // topicItem not in array
            this.getInfoItems().unshift(topicItemDoc);  // add to front of array
        } else {
            this.getInfoItems()[i] = topicItemDoc;      // overwrite in place
        }

        if (saveChanges) {
            try {
                await this.save();
            } catch(e) {
                throw e;
            }
        }
        return topicItemDoc._id;
    }


    async removeInfoItem(id) {
        let index = subElementsHelper.findIndexById(id, this.getInfoItems());
        let item = this.getInfoItems()[index];
        if (InfoItem.isActionItem(item) && !InfoItem.isCreatedInMinutes(item, this._parentMinutes._id)) {
            throw new Meteor.Error('Cannot remove item', 'It is not allowed to remove an action item which was not ' +
                'created within the current minutes');
        }

        if (index !== undefined) {
            this.getInfoItems().splice(index, 1);
            return this.save();
        }
    }

    /**
     * Removes all fire-and-forget elements as well
     * as closed AIs from this topic (info items which are
     * no action items)
     */
    tailorTopic() {
        this._topicDoc.infoItems = this._topicDoc.infoItems.filter((infoItemDoc) => {
            let infoItem = InfoItemFactory.createInfoItem(this, infoItemDoc);
            return infoItem.isSticky();
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
        if (i !== undefined) {
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
        });
    }

    getOnlyActionItems() {
        return this._topicDoc.infoItems.filter((infoItemDoc) => {
            return InfoItem.isActionItem(infoItemDoc);
        });
    }

    getOpenActionItems() {
        return this._topicDoc.infoItems.filter((infoItemDoc) => {
            return InfoItem.isActionItem(infoItemDoc) && infoItemDoc.isOpen;
        });
    }

    setItems(items) {
        this._topicDoc.infoItems = items;
    }

    setSubject(subject) {
        this._topicDoc.subject = subject;
    }

    getSubject() {
        return this._topicDoc.subject;
    }

    async save() {
        return this._parentMinutes.upsertTopic(this._topicDoc);
    }

    async saveAtBottom() {
        return this._parentMinutes.upsertTopic(this._topicDoc, false);
    }

    async toggleState () {    // open/close
        this._topicDoc.isOpen = !this._topicDoc.isOpen;
        return await Meteor.callPromise('minutes.updateTopic', this._topicDoc._id, { isOpen: this._topicDoc.isOpen });
    }

    async closeTopicAndAllOpenActionItems() {
        this._topicDoc.isOpen = false;
        this.getOpenActionItems().forEach(item => {
            item.isOpen = false;
        });
        await this.save();
    }

    hasOpenActionItem() {
        return Topic.hasOpenActionItem(this._topicDoc);
    }

    getDocument() {
        return this._topicDoc;
    }

    addLabelsByIds(labelIds) {
        labelIds.forEach(id => {
            if (!this.hasLabelWithId(id)) {
                this._topicDoc.labels.push(id);
            }
        });
    }

    hasLabelWithId(labelId) {
        let i;
        for (i = 0; i < this._topicDoc.labels.length; i++) {
            if (this._topicDoc.labels[i] === labelId) {
                return true;
            }
        }
        return false;
    }

    getLabelsRawArray() {
        if (!this._topicDoc.labels) {
            return [];
        }
        return this._topicDoc.labels;
    }


    /**
     * Checks whether this topic has associated responsibles
     * or not. This method must have the same name as the
     * actionItem.hasResponsibles method.
     *
     * @return {boolean}
     */
    hasResponsibles () {
        let responsibles = this._topicDoc.responsibles;
        return (responsibles && responsibles.length > 0);
    }

    /**
     * Returns all responsibles associated with this
     * topic. This method must have the same name as the
     * actionItem.getResponsibles method.
     *
     * @return {Array}
     */
    getResponsibles() {
        return this._topicDoc.responsibles;
    }

    addResponsible(responsibleName) {
        let user = Meteor.users.findOne(responsibleName);
        if (user) {
            responsibleName = user.username;
        }

        this._topicDoc.responsibles.push(responsibleName);
    }

    extractResponsiblesFromTopic() {
        const regEx = new RegExp(/(^|[\s.,;])@([a-zA-z]+[^\s.,;]*)/g);
        let subjectString = this._topicDoc.subject;
        let match;

        while ((match = regEx.exec(subjectString)) !== null) {
            let responsibleName = match[2];
            this.addResponsible(responsibleName);
            this._removeResponsibleFromTopic(responsibleName);
        }
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
        this._topicDoc.responsibles = updateTopicDoc.responsibles;
        this._topicDoc.isNew = updateTopicDoc.isNew;
        this._topicDoc.isRecurring = updateTopicDoc.isRecurring;
        this._topicDoc.updatedAt = updateTopicDoc.updatedAt;
        this._topicDoc.updatedBy = updateTopicDoc.updatedBy;
    }

    _removeResponsibleFromTopic(responsibleName) {
        this._topicDoc.subject = this._topicDoc.subject.replace('@' + responsibleName + ' ', '');
        this._topicDoc.subject = this._topicDoc.subject.replace(' @' + responsibleName, '');
        this._topicDoc.subject = this._topicDoc.subject.replace('@' + responsibleName, '');
    }
}
