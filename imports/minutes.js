/**
 * Created by wok on 16.04.16.
 */

import { Meteor } from 'meteor/meteor';
import { MinutesCollection } from './collections/minutes_private';
import { MeetingSeries } from './meetingseries'

export class Minutes {
    constructor(source) {   // constructs obj from Mongo ID or Mongo document
        if (! source)
            return;

        if (typeof source === 'string') {   // we may have an ID here.
            source = Minutes.findOne(source);
        }
        if (typeof source === 'object') { // inject class methods in plain collection document
            _.extend(this, source);
        }
    }

    // ################### static methods
    static find() {
        return MinutesCollection.find.apply(MinutesCollection, arguments);
    }

    static findOne(query, projection) {
        return MinutesCollection.findOne.apply(MinutesCollection, arguments);
    }

    static remove(id) {
        Meteor.call("minutes.remove", id)
    }


    // ################### object methods
    update (docPart) {
        Meteor.call("minutes.updateDocPart", this, docPart);
        _.extend(this, docPart);    // merge new doc fragment into this document
    }

    save (edit) {
        console.log("Minutes.save()");
        if (this.createdAt == undefined) {
            this.createdAt = new Date();
        }
        if (this._id && this._id != "") {
            Meteor.call("minutes.update", this);
            if (edit) {
                Session.set("currentMinutesID", this._id);
            }
        } else {
            if (this.topics == undefined) {
                this.topics = [];
            }
            Meteor.call("minutes.insert", this, edit);
        }
    }

    toString () {
        return "Minutes: "+JSON.stringify(this, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    parentMeetingSeries () {
        return MeetingSeries.findOne(this.meetingSeries_id);
    }
}
