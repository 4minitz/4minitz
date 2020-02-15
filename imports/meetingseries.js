import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { MeetingSeriesSchema } from './collections/meetingseries.schema';
import { MinutesFinder } from '/imports/services/minutesFinder';
import { Minutes } from './minutes';
import { Topic } from './topic';
import { UserRoles } from './userroles';
import { formatDateISO8601 } from '/imports/helpers/date';
import { subElementsHelper } from '/imports/helpers/subElements';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import './helpers/promisedMethods';
import './collections/meetingseries_private';
import moment from 'moment/moment';
import {TopicsFinder} from './services/topicsFinder';

export class MeetingSeries {
    constructor(source) {   // constructs obj from Mongo ID or Mongo document
        if (! source)
            return;

        if (typeof source === 'string') {   // we may have an ID here.
            source = MeetingSeriesSchema.getCollection().findOne(source);
        }
        if (typeof source === 'object') { // inject class methods in plain collection document
            _.extend(this, source);
        }
    }

    // ################### static methods
    static find(...args) {
        return MeetingSeriesSchema.getCollection().find(...args);
    }

    static findOne(...args) {
        return MeetingSeriesSchema.getCollection().findOne(...args);
    }

    static async remove(meetingSeries) {
        return Meteor.callPromise('workflow.removeMeetingSeries', meetingSeries._id);
    }

    static async leave(meetingSeries) {
        return Meteor.callPromise('workflow.leaveMeetingSeries', meetingSeries._id);
    }

    static getAllVisibleIDsForUser (userId) {
        // we return an array with just a list of visible meeting series IDs
        return MeetingSeriesSchema
            .find({visibleFor: {$in: [userId]}}, {_id:1})
            .map(function(item){ return item._id; });
    }

    // ################### object methods

    getRecord() {
        return MeetingSeriesSchema.findOne(this._id);
    }

    async removeMinutesWithId(minutesId) {
        console.log('removeMinutesWithId: ' + minutesId);

        await Minutes.remove(minutesId);
        return this.updateLastMinutesFieldsAsync();
    }


    save(optimisticUICallback) {
        let doc = this;
        if (this._id) {
            return Meteor.callPromise('meetingseries.update', doc);
        } else {
            return Meteor.callPromise('meetingseries.insert', doc, optimisticUICallback);
        }
    }

    async saveAsync(optimisticUICallback) {
        await this.save(optimisticUICallback);
    }

    toString () {
        return 'MeetingSeries: '+JSON.stringify(this, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    addNewMinutes (optimisticUICallback, serverCallback) {
        console.log('addNewMinutes()');

        // The new Minutes object should be dated after the latest existing one
        let newMinutesDate = new Date();
        let lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);
        if (lastMinutes && formatDateISO8601(newMinutesDate) <= lastMinutes.date) {
            let lastMinDate = moment(lastMinutes.date);
            newMinutesDate = lastMinDate.add(1, 'days').toDate();
        }
        // Transfer global note from last minutes if set sticky
        const globalNotePinned = lastMinutes && lastMinutes.globalNotePinned;
        let globalNote = (globalNotePinned) ? lastMinutes.globalNote : '';

        let topics = [];

        // copy open topics from this meeting series & set isNew=false, isSkipped=false
        const openTopics = TopicsFinder.allOpenTopicsOfMeetingSeries(this._id);
        if (openTopics) {
            topics = openTopics;
            topics.forEach((topicDoc) => {
                let topic = new Topic(this, topicDoc);
                topic.tailorTopic();
                topic.invalidateIsNewFlag();
                if (topic.isSkipped()) {
                    topic.toggleSkip();
                }
            });
        }

        let min = new Minutes({
            meetingSeries_id: this._id,
            date: formatDateISO8601(newMinutesDate),
            topics: topics,
            visibleFor: this.visibleFor,             // freshly created minutes inherit visibility of their series
            informedUsers: this.informedUsers,       // freshly created minutes inherit informedUsers of their series
            globalNotePinned: globalNotePinned,
            globalNote: globalNote,
        });

        min.generateNewParticipants();
        min.save(optimisticUICallback, serverCallback);
    }

    upsertTopic() {
        // TODO: refactor topic class and make this method obsolete
    }

    hasMinute(id) {
        for (let minuteId of this.minutes) {
            if (minuteId === id) {
                return true;
            }
        }
    }

    countMinutes () {
        if (this.minutes) {
            return this.minutes.length;
        } else {
            return 0;
        }
    }

    async updateLastMinutesFields (callback) {
        callback = callback || function () {};

        try {
            let result = await this.updateLastMinutesFieldsAsync();
            callback(undefined, result);
        } catch (error) {
            callback(error);
        }
    }

    async updateLastMinutesFieldsAsync(lastMinuteDoc) {
        let updateInfo = {
            _id: this._id
        };
        
        let lastMinutes = lastMinuteDoc ? 
            lastMinuteDoc :
            MinutesFinder.lastMinutesOfMeetingSeries(this);

        updateInfo.lastMinutesDate = lastMinutes ? lastMinutes.date : '';
        updateInfo.lastMinutesId = lastMinutes ? lastMinutes._id : null;
        updateInfo.lastMinutesFinalized = lastMinutes ? lastMinutes.isFinalized : false;
        
        return Meteor.callPromise('meetingseries.update', updateInfo);
    }

    addNewMinutesAllowed() {
        let lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);
        return (!lastMinutes || lastMinutes.isFinalized);
    }

    _getDateOfLatestMinute() {
        let lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);

        if (lastMinutes) {
            return new Date(lastMinutes.date);
        }
    }

    _getDateOfLatestMinuteExcluding(minuteId) {
        // todo: check if excluding the given minuteId could be
        // done directly in the find call on the collection

        let latestMinutes = Minutes.findAllIn(this.minutes, 2)
            .map((minute) => {
                return {
                    _id: minute._id,
                    date: minute.date
                };
            });

        if (!latestMinutes) {
            return;
        }

        let firstNonMatchingMinute = latestMinutes.find((minute) => minute._id !== minuteId);
        if (firstNonMatchingMinute) {
            return new Date(firstNonMatchingMinute.date);
        }
    }

    /**
     * Gets the first possible date which can be assigned
     * to the given minutes.
     *
     * @param minutesId
     * @returns Date or false, if all dates are possible.
     */
    getMinimumAllowedDateForMinutes(minutesId) {
        let firstPossibleDate;

        if (!minutesId) {
            firstPossibleDate = this._getDateOfLatestMinute();
        } else {
            firstPossibleDate = this._getDateOfLatestMinuteExcluding(minutesId);
        }

        if (firstPossibleDate) {
            firstPossibleDate.setHours(0);
            firstPossibleDate.setMinutes(0);
        }

        return firstPossibleDate;
    }

    isMinutesDateAllowed(minutesId, date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        date.setHours(0);
        date.setMinutes(0);

        let firstPossibleDate = this.getMinimumAllowedDateForMinutes(minutesId);
        // if no firstPossibleDate is given, all dates are allowed
        return ( !firstPossibleDate || date > firstPossibleDate );
    }

    /**
     * Overwrite the current "visibleFor" array with new user Ids
     * Needs a "save()" afterwards to persist
     * @param {Array} newVisibleForArray
     * @param {Array} newInformedUsersArray
     */
    setVisibleAndInformedUsers(newVisibleForArray, newInformedUsersArray) {
        if (!this._id) {
            throw new Meteor.Error('MeetingSeries not saved.', 'Call save() before using addVisibleUser()');
        }
        if (!$.isArray(newVisibleForArray)) {
            throw new Meteor.Error('setVisibleUsers()', 'must provide an array!');
        }

        // Clean-up roles
        // Collect all removed users where the meeting series is not visible and not informed anymore
        // And then remove the old meeting series role from these users
        let oldUserArray = this.visibleFor;
        if (this.informedUsers) {
            oldUserArray = oldUserArray.concat(this.informedUsers);
        }
        let newUserArray = newVisibleForArray;
        newUserArray = newUserArray.concat(newInformedUsersArray);

        let removedUserIDs = oldUserArray.filter((usrID) => {
            return newUserArray.indexOf(usrID) === -1;
        });
        removedUserIDs.forEach((removedUserID) => {
            let ur = new UserRoles(removedUserID);
            ur.removeAllRolesForMeetingSeries(this._id);
        });

        // persist new user arrays to meeting series
        this.informedUsers = newInformedUsersArray;
        this.visibleFor = newVisibleForArray;

        // sync visibility for *all* minutes (to allow publish & subscribe)
        Minutes.syncVisibility(this._id, this.visibleFor);

        // sync informed only to *not finalized* minutes (do not change the past!)
        let lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);
        if (lastMinutes && !lastMinutes.isFinalized) {
            lastMinutes.informedUsers = newInformedUsersArray;
            lastMinutes.save();
        }
    }


    isCurrentUserModerator() {
        let ur = new UserRoles();
        return ur.isModeratorOf(this._id);
    }

    findLabel(id) {
        return subElementsHelper.getElementById(id, this.availableLabels);
    }

    findLabelByName(labelName) {
        return subElementsHelper.getElementById(labelName, this.availableLabels, 'name');
    }

    findLabelContainingSubstr(name, caseSensitive) {
        caseSensitive = (caseSensitive === undefined) ? true : caseSensitive;
        return this.availableLabels.filter(label => {
            let left = (caseSensitive) ? label.name : label.name.toUpperCase();
            let right = (caseSensitive) ? name : name.toUpperCase();
            return left.indexOf(right) !== -1;
        });
    }

    removeLabel(id) {
        let index = subElementsHelper.findIndexById(id, this.getAvailableLabels());
        if (undefined === index) {
            return;
        }

        this.availableLabels.splice(index, 1);
    }

    upsertLabel(labelDoc) {
        let i = undefined;
        if (! labelDoc._id) {            // brand-new label
            labelDoc._id = Random.id();
        } else {
            i = subElementsHelper.findIndexById(labelDoc._id, this.availableLabels); // try to find it
        }

        if (i === undefined) {                      // label not in array
            this.availableLabels.unshift(labelDoc);
        } else {
            this.availableLabels[i] = labelDoc;      // overwrite in place
        }
    }

    getAvailableLabels() {
        if (this.availableLabels) {
            return this.availableLabels;
        }
        return [];
    }

    /**
     * Add a new (free-text) responsible to the meeting series.
     * New entry will be pushed to front, existing double will be removed
     * Needs a "save()" afterwards to persist
     * @param {String} newResponsible
     */
    addAdditionalResponsible(newResponsible) {
        // remove newResponsible if already present
        let index = this.additionalResponsibles.indexOf(newResponsible);
        if (index !== -1) {
            this.additionalResponsibles.splice(index, 1);
        }

        // put newResponsible to front of array
        this.additionalResponsibles.unshift(newResponsible);
    }

    findTopic(topicId) {
        return TopicsFinder.getTopicById(topicId, this._id);
    }
}
