import { Label } from './label'
import { _ } from 'meteor/underscore';
import { formatDateISO8601 } from '/imports/helpers/date';

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
            isNew: true,
            isSticky: false,
            labels: []
        });
        this._infoItemDoc = source;
    }

    // ################### static methods
    static isActionItem(infoItemDoc) {
        return (infoItemDoc.itemType === 'actionItem');
    }

    static isCreatedInMinutes(infoItemDoc, minutesId) {
        return (infoItemDoc.createdInMinute === minutesId);
    }

    // ################### object methods
    invalidateIsNewFlag() {
        this._infoItemDoc.isNew = false;
    }

    getId() {
        return this._infoItemDoc._id;
    }

    isSticky() {
        return this._infoItemDoc.isSticky;
    }

    isDeleteAllowed(currentMinutesId) {
        return this._infoItemDoc.createdInMinute === currentMinutesId;
    }

    toggleSticky() {
        this._infoItemDoc.isSticky = !this.isSticky();
    }

    getSubject() {
        return this._infoItemDoc.subject;
    }

    addDetails(minuteId, text) {
        if (text === undefined) text = "";

        let date = formatDateISO8601(new Date());
        if (!this._infoItemDoc.details) {
            this._infoItemDoc.details = [];
        }
        this._infoItemDoc.details.push({
            _id: Random.id(),
            createdInMinute: minuteId,
            date: date,
            text: text
        })
    }

    removeDetails(index) {
        this._infoItemDoc.details.splice(index, 1);
    }

    updateDetails(index, text) {
        if (text === "") {
            throw new Meteor.Error("invalid-argument", "Empty details are not allowed. Use #removeDetails() " +
                "to delete an element");
        }
        if (text != this._infoItemDoc.details[index].text){
            let date = formatDateISO8601(new Date());
            this._infoItemDoc.details[index].date = date;
            this._infoItemDoc.details[index].text = text;
        }
    }

    getDetails() {
        if (!this._infoItemDoc.details) {
            this._infoItemDoc.details = [];
        }

        return this._infoItemDoc.details;
    }

    getDetailsAt(index) {
        if (!this._infoItemDoc.details || index < 0 || index >= this._infoItemDoc.details.length) {
            throw new Meteor.Error('index-out-of-bounds');
        }

        return this._infoItemDoc.details[index];
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
        this._infoItemDoc._id = await this._parentTopic.upsertInfoItem(this._infoItemDoc);
    }

    getParentTopic() {
        return this._parentTopic;
    }

    isActionItem() {
        return InfoItem.isActionItem(this._infoItemDoc);
    }

    getDocument() {
        return this._infoItemDoc;
    }

    getLabels(meetingSeriesId) {
        this._infoItemDoc.labels = this.getLabelsRawArray().filter(labelId => {
            return (null !== Label.createLabelById(meetingSeriesId, labelId));
        });

        return this.getLabelsRawArray().map(labelId => {
            return Label.createLabelById(meetingSeriesId, labelId);

        })
    }

    addLabelByName(labelName, meetingSeriesId) {
        let label = Label.createLabelByName(meetingSeriesId, labelName);
        if (null === label) {
            label = new Label({name: labelName});
            label.save(meetingSeriesId);
        }

        if (!this.hasLabelWithId(label.getId())) {
            this._infoItemDoc.labels.push(label.getId());
        }
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
        const regEx = /(^|[\s.,;])#([a-zA-z]+[^\s.,;]*)/g;
        let match;

        while(match = regEx.exec(this._infoItemDoc.subject)) {
            let labelName = match[2];
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