import { Meteor } from 'meteor/meteor';
import '/imports/helpers/promisedMethods';

import { MinutesSchema } from "../collections/minutes.schema";
import { Minutes } from "../minutes";
import { MeetingSeriesSchema } from "../collections/meetingseries.schema";
import { MeetingSeries } from "../meetingseries";
import {Topic} from "../topic";

function removeIsEditedMS(msId, any) {
    let ms = new MeetingSeries(msId);
    if (any === true) {
        ms.isEditedBy = null;
        ms.isEditedDate = null;
    }
    else {
        if (ms.isEditedBy === Meteor.userId()) {
            ms.isEditedBy = null;
            ms.isEditedDate = null;
        }
    }
    ms.save();
}

function removeIsEditedMin(minuteId, any) {
    let minute = new Minutes(minuteId);
    for (let topic of minute.topics) {
        if (any === true) {
            topic.isEditedBy = null;
            topic.isEditedDate = null;
        }
        else {
            if (topic.isEditedBy === Meteor.userId()) {
                topic.isEditedBy = null;
                topic.isEditedDate = null;
            }
        }
        for (let infoItem of topic.infoItems) {
            if (any === true)
            {
                infoItem.isEditedBy = null;
                infoItem.isEditedDate = null;
            }
            else {
                if(infoItem.isEditedBy === Meteor.userId()) {
                    infoItem.isEditedBy = null;
                    infoItem.isEditedDate = null;
                }
            }
            for (let detail of infoItem.details) {
                if (any === true) {
                    detail.isEditedBy = null;
                    detail.isEditedDate = null;
                }
                else {
                    if (detail.isEditedBy === Meteor.userId()) {
                        detail.isEditedBy = null;
                        detail.isEditedDate = null;
                    }
                }
            }
        }
    }
    minute.save();
}

function removeIsEditedTop(minutesId, topicId) {
    let topic = new Topic(minutesId, topicId);

    topic._topicDoc.isEditedBy = null;
    topic._topicDoc.isEditedDate = null;

    topic.save();
}

function removeIsEditedII(minutesId, topicId, infoItemId) {
    let topic = new Topic(minutesId, topicId);
    let infoItem = topic.findInfoItem(infoItemId);

    infoItem._infoItemDoc.isEditedBy = null;
    infoItem._infoItemDoc.isEditedDate = null;

    infoItem.save();
}

function removeIsEditedDet(minutesId, topicId, infoItemId, detailIdx) {
    let topic = new Topic(minutesId, topicId);
    let infoItem = topic.findInfoItem(infoItemId);

    infoItem._infoItemDoc.details[detailIdx].isEditedBy = null;
    infoItem._infoItemDoc.details[detailIdx].isEditedDate = null;

    infoItem.save();
}

Meteor.methods({

    'workflow.removeIsEditedMeetingSerie'(msId, any) {
        console.log("workflow.removeIsEditedMeetingSerie on " + msId);
        removeIsEditedMS(msId, any);
        console.log("workflow.removeIsEditedMeetingSerie DONE");
    },

    'workflow.removeIsEditedMinute'(minuteId, any) {
        console.log("removeIsEditedMinute on " + minuteId);
        removeIsEditedMin(minuteId, any);
        console.log("removeIsEditedMinute DONE");
    },

    'workflow.removeIsEditedTopic'(minutesId, topicId) {
        console.log("removeIsEditedTopic on " + topicId);
        removeIsEditedTop(minutesId, topicId);
        console.log("removeIsEditedTopic DONE");
    },

    'workflow.removeIsEditedInfoItem'(minutesId, topicId, infoItemId) {
        console.log("removeIsEditedInfoItem on " + infoItemId);
        removeIsEditedII(minutesId, topicId, infoItemId);
        console.log("removeIsEditedTopic DONE");
    },

    'workflow.removeIsEditedDetail'(minutesId, topicId, infoItemId, detailIdx) {
        console.log("removeIsEditedDetail on " + infoItemId + "." + detailIdx);
        removeIsEditedDet(minutesId, topicId, infoItemId, detailIdx);
        console.log("removeIsEditedTopic DONE");
    }
});

export class IsEditedService {
    static removeIsEditedOnLogout() {

        let allMs = MeetingSeriesSchema.getCollection().find();
        allMs.forEach(meetingSerie => {
           Meteor.callPromise('workflow.removeIsEditedMeetingSerie', meetingSerie._id, false);
        });

        let allMinutes = MinutesSchema.getCollection().find();
        allMinutes.forEach(minute => {
            Meteor.callPromise('workflow.removeIsEditedMinute', minute._id, false);
        });
    }

    static removeIsEditedMeetingSerie(msId) {
        Meteor.callPromise('workflow.removeIsEditedMeetingSerie', msId, true);
    }

    static removeIsEditedTopic(minutesId, topicId) {
        Meteor.callPromise('workflow.removeIsEditedTopic', minutesId, topicId);
    }

    static removeIsEditedInfoItem(minutesId, topicId, infoItemId) {
        Meteor.callPromise('workflow.removeIsEditedInfoItem', minutesId, topicId, infoItemId);
    }

    static removeIsEditedDetail(minutesId, topicId, infoItemId, detailIdx) {
        Meteor.callPromise('workflow.removeIsEditedDetail', minutesId, topicId, infoItemId, detailIdx);
    }
}