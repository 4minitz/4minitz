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

    static remove(meetingSeries) {
        if (meetingSeries.countMinutes() > 0) {
            Meteor.call(
                "minutes.remove",
                meetingSeries.getAllMinutes().map(
                    (minutes) => {
                        return minutes._id
                    })
            );
        }
        Meteor.call("meetingseries.remove", meetingSeries._id);
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

    addNewMinutes (optimisticUICallback, serverCallback) {
        console.log("addNewMinutes()");

        // The new Minutes object should be dated after the latest existing one
        let newMinutesDate = new Date();
        let lastMinutes = this.lastMinutes();
        if (lastMinutes && formatDateISO8601(newMinutesDate) <= lastMinutes.date) {
            let lastMinDate = new Date(lastMinutes.date);
            newMinutesDate.setDate(lastMinDate.getDate() + 1);
        }

        let min = new Minutes({
            meetingSeries_id: this._id,
            date: formatDateISO8601(newMinutesDate)
        });

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

    updateLastMinutesDate () {
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
            // server callback
            // TODO: display error / this callback should be provided by the caller of this function
            (error) => {
                if (error) {
                    console.log(error); // for the moment we log this error so we can notice if any error occurs.
                }
            }
        );
    }

    /**
     * Finalizes the given minutes and
     * copies the open/closed topics to
     * this series.
     *
     * @param minutes
     */
    finalizeMinutes (minutes) {
        this.relatedActionItems = minutes.topics.concat(this.relatedActionItems);
        this.save();
        minutes.finalize();
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
                    // remove all elements of the relatedActionItem-Array which are listed as topic from the given minutes
                    this.relatedActionItems = this.relatedActionItems.filter((item) => {
                        return !minutes.findTopic(item._id);
                    });

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

    isMinutesDateAllowed(minutesId, date) {
        if (typeof date === "string") {
            date = new Date(date);
        }

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

            let foo = {}; // dirty way to emulate break in forEach loop...
            try {
                latestMinutes.forEach((minutes) => {
                    if (minutes._id !== minutesId) {
                        firstPossibleDate = new Date(minutes.date);
                        throw foo;
                    }
                });
            } catch(e) {
                if (e !== foo) {
                    throw e;
                }
            }
        }

        return date > firstPossibleDate;
    }
}
