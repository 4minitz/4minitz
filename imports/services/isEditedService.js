import { Meteor } from 'meteor/meteor';
import '/imports/helpers/promisedMethods';

import { MinutesSchema } from "../collections/minutes.schema";
import { Minutes } from "../minutes";
import { MeetingSeriesSchema } from "../collections/meetingseries.schema";
import { MeetingSeries } from "../meetingseries";

function removeIsEditedMeetingSerie(ms) {
    ms.isEditedBy = null;
    ms.isEditedDate = null;
}

function removeIsEditedMinute(minute) {
    for (let topic of minute.topics) {
        topic.isEditedBy = null;
        topic.isEditedDate = null;
        for (let infoItem of topic.infoItems) {
            infoItem.isEditedBy = null;
            infoItem.isEditedDate = null;
            for (let detail of infoItem.details) {
                detail.isEditedBy = null;
                detail.isEditedDate = null;
            }
        }
    }
}

Meteor.methods({

    'removeIsEditedMeetingSerie'(ms) {
        console.log("workflow.removeIsEditedMeetingSerie on " + ms._id);
        removeIsEditedMeetingSerie(ms);
        console.log("workflow.removeIsEditedMeetingSerie DONE");
    },

    'removeIsEditedMinute'(minute) {
        console.log("workflow.removeIsEditedMinute on " + minute._id);
        removeIsEditedMinute(minute);
        console.log("workflow.removeIsEditedMinute DONE");
    }
});

export class IsEditedService {
    static removeIsEditedOnLogout() {

        let allMs = MeetingSeriesSchema.getCollection().find();
        allMs.forEach(meetingSerie => {
           let ms = new MeetingSeries(meetingSerie._id);
           Meteor.callPromise('removeIsEditedMeetingSerie', ms);
           ms.save();
        });

        let allMinutes = MinutesSchema.getCollection().find();
        allMinutes.forEach(minute => {
            let minutes = new Minutes(minute._id);
            Meteor.callPromise('removeIsEditedMinute', minutes);
            minutes.save();
        });
    }
}