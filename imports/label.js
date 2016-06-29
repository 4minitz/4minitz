import { MeetingSeries } from './meetingseries'
import { ColorHelper } from './ColorHelper'

export class Label {

    constructor(source) {
        if (!source) {
            throw new Meteor.Error("It is not allowed to create a Label without the source");
        }

        _.defaults(source, {
            isDefaultLabel: true,
            isDisabled: false,
            color: '#e6e6e6'
        });

        let nameAndColor = source.name.match(/(.*)(#([a-f\d][a-f\d][a-f\d]){1,2})$/);
        if (nameAndColor && nameAndColor.length > 2) {
            source.name = nameAndColor[1];
            source.color = nameAndColor[2];
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

    getId() {
        return this._labelDoc._id;
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

    hasDarkBackground() {
        return ColorHelper.isDarkColor(this.getColor());
    }

    getDocument() {
        return this._labelDoc;
    }

    save(parentMeetingSeries) {
        parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

        parentMeetingSeries.upsertLabel(this._labelDoc);
        parentMeetingSeries.save();
    }

}