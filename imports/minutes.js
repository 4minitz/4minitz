import { Meteor } from 'meteor/meteor';
import { MinutesCollection } from './collections/minutes_private';
import { MeetingSeries } from './meetingseries'
import { Topic } from './topic'
import { ActionItem } from './actionitem'
import { _ } from 'meteor/underscore';
import './helpers/promisedMethods';
import './collections/workflow_private';

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
    static find(...args) {
        return MinutesCollection.find(...args);
    }

    static findOne(...args) {
        return MinutesCollection.findOne(...args);
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
        return Meteor.callPromise("workflow.removeMinute", id);
    }

    static async syncVisibility(parentSeriesID, visibleForArray) {
        return Meteor.callPromise("minutes.syncVisibility", parentSeriesID, visibleForArray);
    }



    // ################### object methods
    
    async update (docPart, callback) {
        _.extend(docPart, {_id: this._id});

        await Meteor.callPromise ("minutes.update", docPart, callback);

        // merge new doc fragment into this document
        _.extend(this, docPart);

        if (docPart.hasOwnProperty('date')) {
            return this.parentMeetingSeries().updateLastMinutesDateAsync();
        }
    }

    save (optimisticUICallback, serverCallback) {
        console.log("Minutes.save()");
        if (this.createdAt === undefined) {
            this.createdAt = new Date();
        }
        if (this._id && this._id !== "") {
            Meteor.call("minutes.update", this);
        } else {
            if (this.topics === undefined) {
                this.topics = [];
            }
            //Meteor.call("minutes.insert", this, optimisticUICallback, serverCallback);
            Meteor.call("workflow.addMinutes", this, optimisticUICallback, serverCallback);
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
    async removeTopic(id) {
        let i = this._findTopicIndex(id);
        if (i != undefined) {
            this.topics.splice(i, 1);
            return this.update({topics: this.topics}); // update only topics array!
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

    getTopicsWithoutItems() {
        return this.topics.map((topicDoc) => {
            topicDoc.infoItems = [];
            return topicDoc;
        })
    }

    async upsertTopic(topicDoc) {
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

        return this.update({topics: this.topics}); // update only topics array!
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
     * Finalizes this minute by calling
     * the workflow-server-method.
     *
     * @param sendActionItems default: true
     * @param sendInfoItems default: true
     */
    finalize(sendActionItems, sendInfoItems) {
        return Meteor.callPromise('workflow.finalizeMinute', this._id, sendActionItems, sendInfoItems);
    }

    /**
     * Unfinalizes this minutes by calling
     * the workflow-server-method.
     */
    unfinalize() {
        return Meteor.callPromise('workflow.unfinalizeMinute', this._id);
    }

    sendAgenda() {
        return Meteor.callPromise('minutes.sendAgenda', this._id);
    }

    getAgendaSentAt() {
        if (!this.agendaSentAt) {
            return false;
        }
        return this.agendaSentAt;
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
     * Sync all users of .visibleFor into .participants
     * This method adds and removes users from the .participants list.
     * But it does not change attributes (e.g. .present) of untouched users
     * Throws an exception if this minutes are finalized
     * @param saveToDB internal saving can be skipped
     */
    async refreshParticipants (saveToDB) {
        if (this.isFinalized) {
            throw new Error("updateParticipants () must not be called on finalized minutes");
        }
        let changed = false;

        // ********************** PHASE-1
        // Add new, not-yet known entries from .visibleFor to .participants
        // construct lookup dict
        if (!this.participants) {
            this.participants = [];
        }
        let participantDict = {};
        this.participants.forEach(participant => {
            participantDict[participant.userId] = true;
        });

        this.visibleFor.forEach(userId => {
            if (!participantDict[userId]) {
                this.participants.push({
                    userId: userId,
                    present: false,
                    minuteKeeper: false
                });
                changed = true;
            }
        });

        // ********************** PHASE-2
        // Remove entries from .participants that are not in .visibleFor anymore
        // construct lookup dict
        if (!this.visibleFor) {
            this.visibleFor = [];
        }
        let visibleForDict = {};
        this.visibleFor.forEach(visUserId => {
            visibleForDict[visUserId] = true;
        });

        let newParticipants = [];
        this.participants.forEach(participant => {
            if (visibleForDict[participant.userId]) {
                newParticipants.push(participant);
            } else {
                // here a former participant is removed
                changed = true;
            }
        });

        // only save if desired and we did change something
        if (saveToDB && changed) {
            console.log("Saving!");
            return this.update({participants: newParticipants}); // update only participants array!
        }
    }


    /**
     * Change presence of a single participant. Immediately updates .participants array
     * TODO Reactive performance may be better if we only update one array element in DB
     * @param index of the participant in the participant array
     * @param isPresent new state of presence
     */
    async updateParticipantPresent(index, isPresent) {
        this.participants[index].present = isPresent;
        return this.update({participants: this.participants});
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
        if (names === "") {
            names = "None.";
        }
        return names;
    }

    checkParent() {
        let parent = this.parentMeetingSeries();
        if (!parent.hasMinute(this._id)) {
            throw new Meteor.Error('runtime-error', 'Minute is an orphan!');
        }
    }

    // ################### private methods
    _findTopicIndex(id) {
        return subElementsHelper.findIndexById(id, this.topics);
    }
}
