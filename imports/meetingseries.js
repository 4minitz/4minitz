import { Meteor } from 'meteor/meteor';
import { MeetingSeriesCollection } from './collections/meetingseries_private';
import { Minutes } from './minutes'
import { Topic } from './topic'
import { InfoItem } from './infoitem'
import { UserRoles } from './userroles'
import { _ } from 'meteor/underscore';
import './helpers/promisedMethods';

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
    static find(...args) {
        return MeetingSeriesCollection.find(...args);
    }

    static findOne(...args) {
        return MeetingSeriesCollection.findOne(...args);
    }

    static async remove(meetingSeries) {
        if (meetingSeries.countMinutes() > 0) {
            await Meteor.callPromise("minutes.removeAllOfSeries", meetingSeries._id);
        }

        return Meteor.callPromise("meetingseries.remove", meetingSeries._id);
    }


    // ################### object methods

    async removeMinutesWithId(minutesId) {
        console.log("removeMinutesWithId: " + minutesId);

        let numberOfRemovedMinutes = await Minutes.remove(minutesId);

        if (numberOfRemovedMinutes === 1) {
            await Meteor.callPromise('meetingseries.removeMinutesFromArray', this._id, minutesId);
            return this.updateLastMinutesDateAsync();
        }
    }


    save(optimisticUICallback) {
        if (this._id) {
            return Meteor.callPromise("meetingseries.update", this);
        } else {
            return Meteor.callPromise("meetingseries.insert", this, optimisticUICallback);
        }
    }

    toString () {
        return "MeetingSeries: "+JSON.stringify(this, null, 4);
    }

    log () {
        console.log(this.toString());
    }

    addNewMinutes (optimisticUICallback, serverCallback) {
        console.log("addNewMinutes()");

        // The new Minutes object should be dated after the latest existing one
        let newMinutesDate = new Date();
        let lastMinutes = this.lastMinutes();
        if (lastMinutes && formatDateISO8601(newMinutesDate) <= lastMinutes.date) {
            let lastMinDate = new Date(lastMinutes.date);
            newMinutesDate.setDate(lastMinDate.getDate() + 1);
        }

        let topics = [];

        // copy open topics from this meeting series & set isNew=false
        if (this.openTopics) {
            topics = this.openTopics;
            topics.forEach((topicDoc) => {
                let topic = new Topic(this, topicDoc);
                topic.invalidateIsNewFlag();
            });
        }

        let min = new Minutes({
            meetingSeries_id: this._id,
            date: formatDateISO8601(newMinutesDate),
            topics: topics,
            visibleFor: this.visibleFor             // freshly created minutes inherit visibility of their series
        });
        
        min.refreshParticipants(false); // do not save to DB!
        min.save(optimisticUICallback, serverCallback);
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
        if (!this.minutes || this.minutes.length === 0) {
            return false;
        }
        let lastMin = Minutes.findAllIn(this.minutes, 1).fetch();
        if (lastMin && lastMin.length === 1) {
            return lastMin[0];
        }
        return false;
    }

    secondLastMinutes () {
        if (!this.minutes || this.minutes.length < 2) {
            return false;
        }
        let secondLastMin = Minutes.findAllIn(this.minutes, 2).fetch();
        if (secondLastMin && secondLastMin.length === 2) {
            return secondLastMin[1];
        }
        return false;
    }

    async updateLastMinutesDate (callback) {
        callback = callback || function () {};

        try {
            let result = await this.updateLastMinutesDateAsync();
            callback(undefined, result);
        } catch (error) {
            callback(error);
        }
    }

    async updateLastMinutesDateAsync() {
        let lastMinutesDate;

        let lastMinutes = this.lastMinutes();
        if (lastMinutes) {
            lastMinutesDate = lastMinutes.date;
        }

        if (!lastMinutesDate) {
            return;
        }

        let updateInfo = {
            _id: this._id,
            lastMinutesDate
        };
        return Meteor.callPromise('meetingseries.update', updateInfo);
    }

    /**
     * Finalizes the given minutes and
     * copies the open/closed topics to
     * this series.
     *
     * @param minutes
     * @param sendActionItems default: true
     * @param sendInfoItems default: true
     */
    finalizeMinutes (minutes, sendActionItems = true, sendInfoItems = true) {
        minutes.finalize(
            sendActionItems, sendInfoItems,
            /* server callback */
            (error) => {
                if (!error) {
                    this._copyTopicsToSeries(minutes);
                    this.save();
                }
            }
        );
    }

    /**
     * Unfinalizes the given minutes and
     * removes the open/closed topics of this
     * minutes from the series.
     *
     * @param minutes
     */
    unfinalizeMinutes (minutes) {
        minutes.unfinalize(
            /* Server callback */
            (error) => {
                if (!error) {
                    let secondLastMinute = this.secondLastMinutes();
                    if (secondLastMinute) {
                        // all fresh created infoItems have to be deleted from the topic list of this series
                        this.topics.forEach(topicDoc => {
                            topicDoc.infoItems = topicDoc.infoItems.filter(infoItemDoc => {
                                return infoItemDoc.createdInMinute !== minutes._id;
                            })
                        });

                        this._copyTopicsToSeries(secondLastMinute);
                    } else {
                        // if we un-finalize our fist minute it is save to delete all open topics
                        // because they are stored inside this minute
                        this.openTopics = [];
                        this.topics = [];
                    }

                    this.save();
                }
            }
        );
    }

    /**
     * A minutes is only allowed to be un-finalized
     * if it is the last one.
     *
     * @param minutesId
     */
    isUnfinalizeMinutesAllowed(minutesId) {
        let lastMinutes = this.lastMinutes();

        return (lastMinutes && lastMinutes._id === minutesId);
    }

    addNewMinutesAllowed() {
        let lastMinutes = this.lastMinutes();
        return (!lastMinutes || lastMinutes.isFinalized);
    }

    _getDateOfLatestMinute() {
        let lastMinutes = this.lastMinutes();

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
        if (typeof date === "string") {
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
     * @param {Array} visibleForArray 
     */
    setVisibleUsers(visibleForArray) {
        if (!this._id) {
            throw new Meteor.Error("MeetingSeries not saved.", "Call save() before using addVisibleUser()");
        }
        if (!$.isArray(visibleForArray)) {
            throw new Meteor.Error("setVisibleUsers()", "must provide an array!");
        }

        this.visibleFor = visibleForArray;
        Minutes.syncVisibility(this._id, this.visibleFor);
    }

    isCurrentUserModerator() {
        let ur = new UserRoles();
        return ur.isModeratorOf(this._id);
    }

    upsertTopic(topicDoc, mergeTopic) {
        let i = undefined;
        if (! topicDoc._id) {             // brand-new topic
            throw new Meteor.Error('Runtime error, it is not allowed to create a new topic in a meeting series');
        } else {
            i = subElementsHelper.findIndexById(topicDoc._id, this.topics); // try to find it
        }

        if (i === undefined) {                      // topic not in array
            this.topics.unshift(topicDoc);  // add to front of array
            i = 0;
        } else {
            if (mergeTopic) {
                let msTopic = new Topic(this, this.topics[i]);
                msTopic.merge(topicDoc);
            } else {
                this.topics[i] = topicDoc;      // overwrite in place
            }
        }

        // close topic if it is completely closed (not just marked as discussed)
        let topic = new Topic(this, topicDoc);
        this.topics[i].isOpen = (!topic.isClosed());
    }

    findTopic(id) {
        return subElementsHelper.getElementById(id, this.topics);
    }

    findLabel(id) {
        return subElementsHelper.getElementById(id, this.availableLabels);
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

    // ################### private methods
    /**
     * Copies the topics from the given
     * minute to this series.
     *
     * This is necessary for both, finalizing a
     * minute and un-finalizing a minute.
     *
     * When finalizing this method will be called
     * with the minute which will be finalized.
     * When un-finalizing a minute this will be called
     * with the 2nd last minute to revert the
     * previous state.
     *
     * @param minutes
     * @private
     */
    _copyTopicsToSeries(minutes) {
        // clear open topics of this series (the minute contains all relevant open topics)
        this.openTopics = [];
        this.topics.forEach((topicDoc) => {
            let topic = new Topic(this, topicDoc);
            topic.invalidateIsNewFlag();
        });

        // iterate backwards through the topics of the minute
        for (let i = minutes.topics.length; i-- > 0;) {
            let topicDoc = minutes.topics[i];
            let topicDocCopy = _.extend({}, topicDoc);
            // pass a copy to our topic object, so this can be tailored for the open topics list
            // without manipulating the original document
            let topic = new Topic(minutes._id, topicDocCopy);

            this.upsertTopic(topicDoc, /*merge*/ true);

            // copy additional the tailored topic to our open topic list
            topic.tailorTopic();
            if (!topic.isClosed()) {
                topic.getDocument().isOpen = true;
                this.openTopics.unshift(topic.getDocument());
            }
        }

        // delete all open topics from msTopicList which are not part of the currently
        // finalized minute -> they were deleted within this minute
        this.topics = this.topics.filter(topic => {
            if (topic.isOpen) {
                let indexInMinute = subElementsHelper.findIndexById(topic._id, minutes.topics);
                return !(indexInMinute === undefined);
            }
            return true;
        })
    }
}
