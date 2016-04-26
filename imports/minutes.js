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

        // update the lastMinuteDate-field of the related series iff the date has changed.
        if (docPart.hasOwnProperty('date')) {
            this.parentMeetingSeries().updateLastMinutesDate();
        }
    }

    save (optimisticUICallback, serverCallback) {
        console.log("Minutes.save()");
        if (this.createdAt == undefined) {
            this.createdAt = new Date();
        }
        if (this._id && this._id != "") {
            Meteor.call("minutes.update", this);
        } else {
            if (this.topics == undefined) {
                this.topics = [];
            }
            Meteor.call("minutes.insert", this, optimisticUICallback, serverCallback);
        }
        this.parentMeetingSeries().updateLastMinutesDate();
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
    removeTopic(id) {
        let i = this._findTopicIndex(id);
        if (i != undefined) {
            this.topics.splice(i, 1);
            this.update({topics: this.topics}); // update only topics array!
        }
    }

    findTopic(id) {
        let i = this._findTopicIndex(id);
        if (i != undefined) {
            return this.topics[i];
        }
        return undefined;
    }

    upsertTopic(topicDoc) {
        let i = undefined;
        if (! topicDoc._id) {             // brand-new topic
            topicDoc._id = Random.id();   // create our own local _id here!
        } else {
            i = this._findTopicIndex(topicDoc._id); // try to find it
        }
        if (i == undefined) {                      // topic not in array
            this.topics.unshift(topicDoc);  // add to front of array
        } else {
            this.topics[i] = topicDoc;      // overwrite in place
        }
        this.update({topics: this.topics}); // update only topics array!
    }

    /**
     * Finalizes this minutes object. Shall
     * only be called from the finalize method
     * within the meeting series.
     */
    finalize() {
        Meteor.call('minutes.finalize', this._id);
    }


    // ################### private methods
    _findTopicIndex(id) {
        let i;
        for (i = 0; i < this.topics.length; i++) {
            if (id === this.topics[i]._id) {
                return i;
            }
        }
        return undefined;
    }

}
