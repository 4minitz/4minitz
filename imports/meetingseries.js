/**
 * Created by wok on 16.04.16.
 */

import { Meteor } from 'meteor/meteor';
import { MeetingSeriesCollection } from './collections/meetingseries_private';
import { Minutes } from './minutes'

export class MeetingSeries {
    constructor(source) {   // constructs obj from Mongo ID or Mongo document
        if (! source)
            return;

        if (typeof source === 'string') {   // we may have an ID here.
            source = MeetingSeriesCollection.findOne(source);
        }
        if (typeof source === 'object') { // inject class methods in plain collection document
            _.extend(this, source);
        }
    }

    // ################### static methods
    static find() {
        return MeetingSeriesCollection.find.apply(MeetingSeriesCollection, arguments);
    }

    static findOne() {
        return MeetingSeriesCollection.findOne.apply(MeetingSeriesCollection, arguments);
    }

    static remove(id) {
        Meteor.call("meetingseries.remove", id)
    }

    static removeMinutesWithId(meetingSeriesId, minutesId) {
        // when removing minutes, remove the id from the minutes array in the
        // this meetingSeries as well.
        Meteor.call('meetingseries.removeMinutesFromArray', meetingSeriesId, minutesId);

        // last but not least we remove the minutes itself.
        Minutes.remove(minutesId);
    }


    // ################### object methods
    save () {
        if (this._id && this._id != "") {
            console.log("My Minutes:"+this.minutes);
            Meteor.call("meetingseries.update", this);
        } else {
            Meteor.call("meetingseries.insert", this);
        }
    }

    toString () {
        return "MeetingSeries: "+JSON.stringify(this, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    addNewMinutes () {
        console.log("addNewMinutes()");
        let min = new Minutes({
            meetingSeries_id: this._id,
            date: formatDateISO8601(new Date())
        });
        min.save(true);
    }

    getAllMinutes () {
        return Minutes.findAllIn(this.minutes);
    }

    countMinutes () {
        if (this.minutes) {
            return this.minutes.length;
        } else {
            return 0;
        }
    }

    lastMinutes () {
        if (!this.minutes || this.minutes.length == 0) {
            return false;
        }
        let lastMin = Minutes.findAllIn(this.minutes, 1).fetch();
        if (lastMin && lastMin.length == 1) {
            return lastMin[0];
        }
        return false;
    }
}
