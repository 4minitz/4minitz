import { Meteor } from 'meteor/meteor';
import { MinutesCollection } from './collections/minutes_private';
import { MeetingSeries } from './meetingseries'
import { Topic } from './topic'
import { ActionItem } from './actionitem'
import { _ } from 'meteor/underscore';
import './helpers/promisedMethods';

export class Minutes {
    constructor(source) {   // constructs obj from Mongo ID or Mongo document
        if (! source)
            throw new Meteor.Error('invalid-argument', 'Mongo ID or Mongo document required');

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
        return Meteor.callPromise("minutes.remove", id);
    }

    static syncVisibility(parentSeriesID, visibleForArray) {
        Meteor.call("minutes.syncVisibility", parentSeriesID, visibleForArray);
    }



    // ################### object methods
    update (docPart, callback) {
        _.extend(docPart, {_id: this._id});
        Meteor.call("minutes.update", docPart, callback);
        _.extend(this, docPart);    // merge new doc fragment into this document

        // update the lastMinuteDate-field of the related series iff the date has changed.
        if (docPart.hasOwnProperty('date')) {
            this.parentMeetingSeries().updateLastMinutesDate(callback);
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
        this.parentMeetingSeries().updateLastMinutesDate(serverCallback);
    }

    toString () {
        return "Minutes: "+JSON.stringify(this, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    parentMeetingSeries () {
        return new MeetingSeries(this.meetingSeries_id);
    }

    parentMeetingSeriesID () {
        return this.meetingSeries_id;
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

    /**
     * Returns all topics which are created
     * within this meeting.
     */
    getNewTopics() {
        return this.topics.filter((topic) => {
            return topic.isNew;
        });
    }

    /**
     * Returns all old topics which were closed
     * within this topic.
     */
    getOldClosedTopics() {
        return this.topics.filter((topic) => {
            return ( !topic.isNew && !topic.isOpen && !Topic.hasOpenActionItem(topic) );
        });
    }

    /**
     * Checks whether this minute has at least one
     * open AI.
     *
     * @returns {boolean}
     */
    hasOpenActionItems() {
        for (let i = this.topics.length; i-- > 0;) {
            let topic = new Topic(this, this.topics[i]);
            if (topic.hasOpenActionItem()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns tailored topics which
     * does only contain info items.
     */
    getTopicsWithOnlyInfoItems() {
        return this.topics.map((topicDoc) => {
            let topic = new Topic(this, topicDoc);
            topicDoc.infoItems = topic.getOnlyInfoItems();
            return topicDoc;
        })
    }

    upsertTopic(topicDoc, callback) {
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
        this.update({topics: this.topics}, callback); // update only topics array!
    }

    /**
     *
     * @returns ActionItem[]
     */
    getOpenActionItems() {
        return this.topics.reduce((acc, topicDoc) => {
            let topic = new Topic(this, topicDoc);
            let actionItemDocs = topic.getOpenActionItems();
            return acc.concat(
                actionItemDocs.map(doc => {
                    return new ActionItem(topic, doc);
                })
            );
        }, /* initial value */[]);
    }

    /**
     * Finalizes this minutes object. Shall
     * only be called from the finalize method
     * within the meeting series.
     */
    finalize(sendActionItems, sendInfoItems, serverCallback) {
        Meteor.call('minutes.finalize', this._id, sendActionItems, sendInfoItems, serverCallback);
    }

    /**
     * Unfinalizes this minutes object. Shall
     * only be called from the finalize method
     * within the meeting series.
     */
    unfinalize(serverCallback) {
        Meteor.call('minutes.unfinalize', this._id, serverCallback);
    }

    isCurrentUserModerator() {
        return this.parentMeetingSeries().isCurrentUserModerator();
    }

    /**
     * Gets all persons who want to be
     * informed about this minute.
     *
     * @returns {string[]} of user ids
     */
    getPersonsInformed() {
       return this.visibleFor;
    }

    /**
     * Returns all informed persons with name and
     * email address.
     * Skips all persons with no email address.
     *
     * @param userCollection
     * @returns {Array}
     */
    getPersonsInformedWithEmail(userCollection) {
        return this.getPersonsInformed().reduce((recipients, userId) => {
            let user = userCollection.findOne(userId);
            if (user.emails && user.emails.length > 0) {
                recipients.push({
                    userId: userId,
                    name: user.username,
                    address: user.emails[0].address
                });
            }
            return recipients;
        }, /* initial value */ []);
    }


    /**
     * Add users of .visibleFor that are not yet in .participants to .participants
     * So, this method can be called multiple times to refresh the .participants array.
     * This method never removes users from the .participants list!
     * Trows an exception if this minutes are finalized
     * @param saveToDB internal saving can be skipped
     */
    refreshParticipants (saveToDB) {
        if (this.isFinalized) {
            throw new Error("updateParticipants () must not be called on finalized minutes");
        }

        // construct lookup dict
        let participantKnown = {};
        if (!this.participants) {
            this.participants = [];
        }
        this.participants.forEach(parti => {
            participantKnown[parti.userId] = true;
        });

        // add unknown entries from .visibleFor
        this.visibleFor.forEach(userId => {
            if (!participantKnown[userId]) {
                this.participants.push({
                    userId: userId,
                    present: false,
                    minuteKeeper: false
                });
            }
        });

        // did we add anything?
        if (saveToDB && this.participants.length > Object.keys(participantKnown).length) {
            this.update({participants: this.participants}); // update only participants array!
        }
    }


    /**
     * Change presence of a single participant. Immediately updates .participants array
     * TODO Reactive performance may be better if we only update one array element in DB
     * @param index of the participant in the participant array
     * @param isPresent new state of presence
     */
    updateParticipantPresent(index, isPresent) {
        this.participants[index].present = isPresent;
        this.update({participants: this.participants});
    }

    /**
     * Returns the list of participants and adds the name of
     * each participants if a userCollection is given.
     * @param userCollection to query for the participants name.
     * @returns {Array}
     */
    getParticipants(userCollection) {
        if (userCollection) {
            return this.participants.map(participant => {
                let user = userCollection.findOne(participant.userId);
                participant.name = user.username;
                return participant;
            });
        }

        return this.participants;
    }


    /**
     * Returns a human readable list of present participants of the meeting
     * @param maxChars truncate and add ellipsis if necessary
     * @returns {String} with comma separated list of names
     */
    getPresentParticipantNames(maxChars) {
        let names = "";
        this.participants.forEach(part => {
            if (part.present) {
                let name = Meteor.users.findOne(part.userId).username;
                names = names + name + ", ";
            }
        });
        if (this.participantsAdditional) {
            names = names + this.participantsAdditional;
        } else {
            names = names .slice(0, -2);    // delete last ", "
        }
        if (maxChars && names.length > maxChars) {
            return names.substr(0, maxChars)+"...";
        }
        return names;
    }



    // ################### private methods
    _findTopicIndex(id) {
        return subElementsHelper.findIndexById(id, this.topics);
    }

}
