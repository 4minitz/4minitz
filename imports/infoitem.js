/**
 * Created by felix on 09.05.16.
 */

import { Topic } from './topic'
import { Label } from './label'
import { _ } from 'meteor/underscore';

/**
 * A InfoItem is a sub-element of
 * a topic which has a subject,
 * a date when is was created
 * and a list of associated tags.
 */
export class InfoItem {

    constructor(parentTopic, source) {
        if (!parentTopic || !source)
            throw new Meteor.Error("It is not allowed to create a InfoItem without the parentTopicId and the source");

        this._parentTopic = undefined;
        this._infoItemDoc = undefined;

        if (typeof parentTopic === 'object') {   // we have a topic object here.
            this._parentTopic = parentTopic;
        }
        if (!this._parentTopic) {
            throw new Meteor.Error("No parent Topic given!");
        }

        if (typeof source === 'string') {   // we may have an ID here.
            // Caution: findInfoItem returns a InfoItem-Object not the document itself!
            let infoItem = this._parentTopic.findInfoItem(source);
            source = infoItem._infoItemDoc;
        }

        if (!source.hasOwnProperty('createdInMinute')) {
            throw new Meteor.Error('Property createdInMinute of topicDoc required');
        }

        _.defaults(source, {
            itemType: 'infoItem',
            isSticky: false,
            labels: []
        });
        this._infoItemDoc = source;
    }

    // ################### static methods
    static isActionItem(infoItemDoc) {
        return (infoItemDoc.itemType === 'actionItem');
    }

    // ################### object methods
    invalidateIsNewFlag() {
        // a normal info item has no isNew-Flag so it is nothing to do here
    }

    isSticky() {
        return this._infoItemDoc.isSticky;
    }

    toggleSticky() {
        this._infoItemDoc.isSticky = !this.isSticky();
    }

    async save(callback) {
        callback = callback || function () {};

        try {
            let result = await this.saveAsync();
            callback(undefined, result);
        } catch (error) {
            callback(error);
        }
    }

    async saveAsync() {
        // caution: this will update the entire topics array from the parent minutes of the parent topic!
        return this._parentTopic.upsertInfoItem(this._infoItemDoc);
    }

    getParentTopic() {
        return this._parentTopic;
    }

    isActionItem() {
        return InfoItem.isActionItem(this._infoItemDoc);
    }

    getLabels(meetingSeriesId) {
        return this.getLabelsRawArray().map(labelId => {
            return Label.createLabelById(meetingSeriesId, labelId);
        })
    }

    addLabelByName(labelName, meetingSeriesId) {
        let label = Label.createLabelByName(meetingSeriesId, labelName);
        if (null == label) {
            label = new Label({name: labelName});
            label.save(meetingSeriesId);
        }

        if (!this.hasLabelWithId(label.getId())) {
            this._infoItemDoc.labels.push(label.getId());
        }

        console.log(this._infoItemDoc.labels);
    }

    hasLabelWithId(labelId) {
        let i;
        for (i = 0; i < this._infoItemDoc.labels.length; i++) {
            if (this._infoItemDoc.labels[i] === labelId) {
                return true;
            }
        }
        return false;
    }

    getLabelsRawArray() {
        if (!this._infoItemDoc.labels) {
            return [];
        }
        return this._infoItemDoc.labels;
    }

    toString () {
        return "InfoItem: " + JSON.stringify(this._infoItemDoc, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    extractLabelsFromSubject(meetingSeriesId) {
        const regEx = /(^|[\s.,;])#([^\s.,;]+)/g;
        let match;

        while(match = regEx.exec(this._infoItemDoc.subject)) {
            let labelName = match[2];
            console.log(labelName);
            this.addLabelByName(labelName, meetingSeriesId);
            this._removeLabelFromSubject(labelName);
        }
    }

    _removeLabelFromSubject(labelName) {
        this._infoItemDoc.subject = this._infoItemDoc.subject.replace("#" + labelName + " ", "");
        this._infoItemDoc.subject = this._infoItemDoc.subject.replace(" #" + labelName, "");
        this._infoItemDoc.subject = this._infoItemDoc.subject.replace("#" + labelName, "");
    }

}