import { Meteor } from 'meteor/meteor';
import '/imports/helpers/promisedMethods';

import { MinutesSchema } from "../collections/minutes.schema";
import { Minutes } from "../minutes";
import { MeetingSeriesSchema } from "../collections/meetingseries.schema";
import { MeetingSeries } from "../meetingseries";
import {Topic} from "../topic";

function setIsEditedMS(msId) {
    let ms = new MeetingSeries(msId);

    ms.isEditedBy = Meteor.userId();
    ms.isEditedDate = new Date();

    ms.save();
}

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

function setIsEditedTop(minutesId, topicId) {
    let topic = new Topic(minutesId, topicId);

    topic._topicDoc.isEditedBy = Meteor.userId();
    topic._topicDoc.isEditedDate = new Date();

    topic.save();
}

function removeIsEditedTop(minutesId, topicId, any) {
    let topic = new Topic(minutesId, topicId);

    if (any === true) {
        topic._topicDoc.isEditedBy = null;
        topic._topicDoc.isEditedDate = null;
    }
    else {
        if (ms.isEditedBy === Meteor.userId()) {
            topic._topicDoc.isEditedBy = null;
            topic._topicDoc.isEditedDate = null;
        }
    }
    topic.save();
}

function setIsEditedII(minutesId, topicId, infoItemId) {
    let topic = new Topic(minutesId, topicId);
    let infoItem = topic.findInfoItem(infoItemId);

    infoItem._infoItemDoc.isEditedBy = Meteor.userId();
    infoItem._infoItemDoc.isEditedDate = new Date();

    infoItem.save();
}

function removeIsEditedII(minutesId, topicId, infoItemId, any) {
    let topic = new Topic(minutesId, topicId);
    let infoItem = topic.findInfoItem(infoItemId);

    if (any === true) {
        infoItem._infoItemDoc.isEditedBy = null;
        infoItem._infoItemDoc.isEditedDate = null;
    }
    else {
        if (ms.isEditedBy === Meteor.userId()) {
            infoItem._infoItemDoc.isEditedBy = null;
            infoItem._infoItemDoc.isEditedDate = null;
        }
    }

    infoItem.save();
}

function setIsEditedDet(minutesId, topicId, infoItemId, detailIdx) {
    let topic = new Topic(minutesId, topicId);
    let infoItem = topic.findInfoItem(infoItemId);

    infoItem._infoItemDoc.details[detailIdx].isEditedBy = Meteor.userId();
    infoItem._infoItemDoc.details[detailIdx].isEditedDate = new Date();

    infoItem.save();
}

function removeIsEditedDet(minutesId, topicId, infoItemId, detailIdx, any) {
    let topic = new Topic(minutesId, topicId);
    let infoItem = topic.findInfoItem(infoItemId);

    if (any === true) {
        infoItem._infoItemDoc.details[detailIdx].isEditedBy = null;
        infoItem._infoItemDoc.details[detailIdx].isEditedDate = null;
    }
    else {
        if (ms.isEditedBy === Meteor.userId()) {
            infoItem._infoItemDoc.details[detailIdx].isEditedBy = null;
            infoItem._infoItemDoc.details[detailIdx].isEditedDate = null;
        }
    }

    infoItem.save();
}

Meteor.methods({

    'workflow.setIsEditedMeetingSerie'(msId) {
        console.log("workflow.setIsEditedMeetingSerie on " + msId);
        setIsEditedMS(msId);
        console.log("workflow.setIsEditedMeetingSerie DONE");
    },

    'workflow.removeIsEditedMeetingSerie'(msId, any) {
        console.log("workflow.removeIsEditedMeetingSerie on " + msId);
        removeIsEditedMS(msId, any);
        console.log("workflow.removeIsEditedMeetingSerie DONE");
    },

    'workflow.removeIsEditedMinute'(minuteId, any) {
        console.log("workflow.removeIsEditedMinute on " + minuteId);
        removeIsEditedMin(minuteId, any);
        console.log("workflow.removeIsEditedMinute DONE");
    },

    'workflow.setIsEditedTopic'(minutesId, topicId) {
        console.log("workflow.setIsEditedTopic on " + topicId);
        setIsEditedTop(minutesId, topicId);
        console.log("workflow.setIsEditedTopic DONE");
    },

    'workflow.removeIsEditedTopic'(minutesId, topicId, any) {
        console.log("workflow.removeIsEditedTopic on " + topicId);
        removeIsEditedTop(minutesId, topicId, any);
        console.log("workflow.removeIsEditedTopic DONE");
    },

    'workflow.setIsEditedInfoItem'(minutesId, topicId, infoItemId) {
        console.log("workflow.setIsEditedInfoItem on " + infoItemId);
        setIsEditedII(minutesId, topicId, infoItemId);
        console.log("workflow.setIsEditedInfoItem DONE");
    },

    'workflow.removeIsEditedInfoItem'(minutesId, topicId, infoItemId, any) {
        console.log("workflow.removeIsEditedInfoItem on " + infoItemId);
        removeIsEditedII(minutesId, topicId, infoItemId, any);
        console.log("workflow.removeIsEditedTopic DONE");
    },

    'workflow.setIsEditedDetail'(minutesId, topicId, infoItemId, detailIdx) {
        console.log("workflow.setIsEditedDetail on " + infoItemId + "." + detailIdx);
        setIsEditedDet(minutesId, topicId, infoItemId, detailIdx);
        console.log("workflow.setIsEditedDetail DONE");
    },

    'workflow.removeIsEditedDetail'(minutesId, topicId, infoItemId, detailIdx, any) {
        console.log("workflow.removeIsEditedDetail on " + infoItemId + "." + detailIdx);
        removeIsEditedDet(minutesId, topicId, infoItemId, detailIdx, any);
        console.log("workflow.removeIsEditedTopic DONE");
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

    static setIsEditedMeetingSerie(msId) {
        Meteor.callPromise('workflow.setIsEditedMeetingSerie', msId);
    }

    static removeIsEditedMeetingSerie(msId, any) {
        Meteor.callPromise('workflow.removeIsEditedMeetingSerie', msId, any);
    }

    static setIsEditedTopic(minutesId, topicId) {
        Meteor.callPromise('workflow.setIsEditedTopic', minutesId, topicId);
    }

    static removeIsEditedTopic(minutesId, topicId, any) {
        Meteor.callPromise('workflow.removeIsEditedTopic', minutesId, topicId, any);
    }

    static setIsEditedInfoItem(minutesId, topicId, infoItemId) {
        Meteor.callPromise('workflow.setIsEditedInfoItem', minutesId, topicId, infoItemId);
    }

    static removeIsEditedInfoItem(minutesId, topicId, infoItemId, any) {
        Meteor.callPromise('workflow.removeIsEditedInfoItem', minutesId, topicId, infoItemId, any);
    }

    static setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx) {
        Meteor.callPromise('workflow.setIsEditedDetail', minutesId, topicId, infoItemId, detailIdx);
    }

    static removeIsEditedDetail(minutesId, topicId, infoItemId, detailIdx, any) {
        Meteor.callPromise('workflow.removeIsEditedDetail', minutesId, topicId, infoItemId, detailIdx, any);
    }
}