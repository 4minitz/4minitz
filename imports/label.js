import { MeetingSeries } from './meetingseries'

export class Label {

    constructor(source) {
        if (!source) {
            throw new Meteor.Error("It is not allowed to create a Label without the source");
        }

        this._labelDoc = source;

    }

    static createLabelById(parentMeetingSeries, labelId) {
        parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

        let labelDoc = parentMeetingSeries.findLabel(labelId);
        if (labelDoc) return new Label(labelDoc);
        return null;
    }

    static _createParentMeetingSeries(parentMeetingSeries) {
        if (typeof parentMeetingSeries === 'string') {
            return new MeetingSeries(parentMeetingSeries);
        } else if (parentMeetingSeries.hasOwnProperty('findLabel')) {
            return parentMeetingSeries;
        }

        throw new Meteor.Error("Invalid parent meeting series");
    }

    setName(name) {
        this._labelDoc.name = name;
    }

    getName() {
        return this._labelDoc.name;
    }

    getColor() {
        return this._labelDoc.color;
    }

    setColor(color) {
        this._labelDoc.color = color;
    }

    save(parentMeetingSeries) {
        parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

        parentMeetingSeries.upsertLabel(this._labelDoc);
        parentMeetingSeries.save();
    }

}