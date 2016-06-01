/**
 * Created by wok on 16.04.16.
 */

import { Meteor } from 'meteor/meteor';
import { MeetingSeriesCollection } from './collections/meetingseries_private';
import { Minutes } from './minutes'
import { Topic } from './topic'
import { InfoItem } from './infoitem'
import { UserRoles } from './userroles'
import { _ } from 'meteor/underscore';

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

    static remove(meetingSeries) {
        if (meetingSeries.countMinutes() > 0) {
            Meteor.call(
                "minutes.removeAllOfSeries",
                meetingSeries._id,
                /* server callback */
                (error) => {
                    if (!error) {
                        // if all related minutes were delete we can delete the series as well
                        Meteor.call("meetingseries.remove", meetingSeries._id);
                    }
                }
            );
        } else {
            // we have no related minutes so we can delete the series blindly
            Meteor.call("meetingseries.remove", meetingSeries._id);
        }
    }


    // ################### object methods

    removeMinutesWithId(minutesId) {
        console.log("removeMinutesWithId: " + minutesId);

        // first we remove the minutes itself
        Minutes.remove(
            minutesId,
            /* server callback */
            (error, result) => { // result contains the number of removed items
                if (!error && result == 1) {
                    // if the minutes has been removed
                    // we remove the id from the minutes array in
                    // this meetingSeries as well.
                    Meteor.call('meetingseries.removeMinutesFromArray', this._id, minutesId);

                    // last but not least we update the lastMinutesDate-field
                    this.updateLastMinutesDate();
                }
            }
        );
    }

    save (callback) {
        if (this._id && this._id != "") {
            Meteor.call("meetingseries.update", this, callback);
        } else {
            Meteor.call("meetingseries.insert", this, callback);
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
                Topic.invalidateIsNewFlag(topicDoc);
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
        if (!this.minutes || this.minutes.length == 0) {
            return false;
        }
        let lastMin = Minutes.findAllIn(this.minutes, 1).fetch();
        if (lastMin && lastMin.length == 1) {
            return lastMin[0];
        }
        return false;
    }

    secondLastMinutes () {
        if (!this.minutes || this.minutes.length < 2) {
            return false;
        }
        let secondLastMin = Minutes.findAllIn(this.minutes, 2).fetch();
        if (secondLastMin && secondLastMin.length == 2) {
            return secondLastMin[1];
        }
        return false;
    }

    updateLastMinutesDate (callback) {
        let lastMinutesDate;

        let lastMinutes = this.lastMinutes();
        if (lastMinutes) {
            lastMinutesDate = lastMinutes.date;
        }

        if (!lastMinutesDate) {
            return;
        }

        Meteor.call(
            'meetingseries.update', {
                _id: this._id,
                lastMinutesDate: lastMinutesDate
            },
            callback
        );
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
            // we have no minutes id, so the first possible date depends on the last minutes
            let lastMinutes = this.lastMinutes();
            if (lastMinutes) {
                firstPossibleDate = new Date(lastMinutes.date);
            }
        } else {
            // fetch the two latest minutes, because the given one could be the latest minute.
            let latestMinutes = Minutes.findAllIn(this.minutes, 2);

            if (latestMinutes) {
                let foo = {}; // dirty way to emulate break in forEach loop...
                try {
                    latestMinutes.forEach((minutes) => {
                        if (minutes._id !== minutesId) {
                            firstPossibleDate = new Date(minutes.date);
                            throw foo;
                        }
                    });
                } catch (e) {
                    if (e !== foo) {
                        throw e;
                    }
                }
            }
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

    // ################### private methods
    _mergeTopic(topicIndex, minutesTopicDoc) {
        let msTopicDoc = this.topics[topicIndex];

        msTopicDoc = Topic.overwritePrimitiveProperties(minutesTopicDoc, msTopicDoc);

        // loop backwards through topic items
        for (let i = minutesTopicDoc.infoItems.length; i-- > 0;) {
            let infoDoc = minutesTopicDoc.infoItems[i];


            let indexInMsTopicDoc = subElementsHelper.findIndexById(infoDoc._id, msTopicDoc.infoItems);
            if (indexInMsTopicDoc === undefined) {
                // item does not exist -> simply prepend
                msTopicDoc.infoItems.unshift(infoDoc);
            } else {
                // update the existing one
                msTopicDoc.infoItems[indexInMsTopicDoc] = infoDoc;
            }
        }

        // delete all open AIs listed in the msTopicDoc but not in the minutesTopicDoc
        // (these were deleted during the last minute)
        msTopicDoc.infoItems = msTopicDoc.infoItems.filter(itemDoc => {
            let openAI = InfoItem.isActionItem(itemDoc) && itemDoc.isOpen;
            if (openAI) {
                let indexInMinutesTopicDoc = subElementsHelper.findIndexById(itemDoc._id, minutesTopicDoc.infoItems);
                return !(indexInMinutesTopicDoc === undefined);
            }
            return true;
        });
    }

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
            Topic.invalidateIsNewFlag(topicDoc);
        });

        // iterate backwards through the topics of the minute
        for (let i = minutes.topics.length; i-- > 0;) {
            let topicDoc = minutes.topics[i];
            let topicDocCopy = _.extend({}, topicDoc);
            // pass a copy to our topic object, so this can be tailored for the open topics list
            // without manipulating the original document
            let topic = new Topic(minutes._id, topicDocCopy);

            // check if topic already exists in meeting series
            let indexInSeries = Topic.findTopicIndexInArray(topicDoc._id, this.topics);
            if (indexInSeries === undefined) {
                // topic does not exist so we simply prepend the topic to our array
                this.topics.unshift(topicDoc);
                indexInSeries = 0;
            } else {
                // topic already exists, here we do the magic merge
                this._mergeTopic(indexInSeries, topicDoc);
                this.topics[indexInSeries].isNew = false;
            }

            // change topic state depending on the state of its AIs
            this.topics[indexInSeries].isOpen = (topicDoc.isOpen || topic.hasOpenActionItem());

            // copy additional the tailored topic to our open topic list
            topic.tailorTopic();
            if (topic.getDocument().isOpen || topic.hasOpenActionItem()) {
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
