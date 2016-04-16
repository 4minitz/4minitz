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

    static findOne(query, projection) {
        return MeetingSeriesCollection.findOne.apply(MeetingSeriesCollection, arguments);
    }

    static remove(id) {
        Meteor.call("meetingseries.remove", id)
    }


    // ################### object methods
    save () {
        if (this._id && this._id != "") {
            console.log("My Minutes:"+this.minutes);
            Meteor.call("meetingseries.update", this);
        } else {
            if (this.createdAt == undefined) {
                this.createdAt = new Date();
            }
            if (this.minutes == undefined) {
                this.minutes = [];
            }
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
        console.log("   Constr. OK");
        min.save(true);
    }
}
