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

    static findOne() {
        return MinutesCollection.findOne.apply(MinutesCollection, arguments);
    }

    static findAllIn(MinutesIDArray, limit) {
        console.log("findAllIn: >"+MinutesIDArray+"<");
        if (!MinutesIDArray || MinutesIDArray.length == 0) {
            return [];
        }

        let options = {sort: {date: -1}};
        if (limit) {
            options["limit"] = limit;
        }
        return MinutesCollection.find(
            {_id: {$in: MinutesIDArray}},
            options);
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

    // This also does a minimal update of collection!
    removeTopicWithID(id) {
        let i = -1;
        for (i = 0; i < this.topics.length; i++) {
            if (id === this.topics[i]._id) {
                break;
            }
        }
        if (i > -1) {
            this.topics.splice(i, 1);
            this.update({topics: this.topics}); // update only topics array!
        }
    }
}
