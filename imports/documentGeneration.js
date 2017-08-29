/**
 * This class collects helper methods for HTML meeting minutes to
 *    - download meeting minute files as HTML
 *    - send meeting minutes as HTML eMails
 */

import { Meteor } from 'meteor/meteor';

import { Minutes } from './minutes';
import { Topic } from './topic';
import { Attachment } from './attachment';
import { GlobalSettings } from './config/GlobalSettings';
import { ActionItem } from './actionitem';

import './helpers/promisedMethods';
import {LabelResolver} from './services/labelResolver';

export class DocumentGeneration {
    // ********** static methods ****************
    static async downloadMinuteProtocol(minuteID) {
        //Create HTML
        let htmldata = await Meteor.callPromise('documentgeneration.createHTML', minuteID);
        let currentMinute = new Minutes(minuteID);
        //Download File
        let fileBlob = new Blob([htmldata], {type:'octet/stream'});

        const filename = currentMinute.parentMeetingSeries().getRecord().name + '-' + Minutes.findOne(minuteID).date + '.html';

        if (window.navigator.msSaveOrOpenBlob) { // necessary for Internet Explorer, since it does'nt support the download-attribute for anchors
            window.navigator.msSaveBlob(fileBlob, filename);
        } else {
            let fileurl  = window.URL.createObjectURL(fileBlob);

            let a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = fileurl;
            a.download = filename;
            a.click();

            setTimeout(function () {
                window.URL.revokeObjectURL(fileurl);
            }, 250);
        }
    }
    // ********** static methods for generation of HTML Document ****************
    static generateResponsibleStringsForTopic(context) {
        context._topics.forEach(topic => {
            let aTopicObj = new Topic (context._minute._id, topic);
            topic.responsiblesString = '';
            if (aTopicObj.hasResponsibles()) {
                topic.responsiblesString = '('+aTopicObj.getResponsiblesString()+')';
            }
            console.dir(context);
            topic.labelsString =
                LabelResolver.resolveAndformatLabelsString(aTopicObj.getLabelsRawArray(), context._meetingSeries._id);

            // inject responsibles as readable short user names to all action items of this topic
            for (let i = 0; i < topic.infoItems.length; i++) {
                if (topic.infoItems[i].itemType === 'actionItem') {
                    let anActionItemObj = new ActionItem(topic, topic.infoItems[i]);
                    if (anActionItemObj.hasResponsibles()) {
                        topic.infoItems[i].responsiblesString = '('+anActionItemObj.getResponsiblesString('@')+')';
                    }
                }
            }
        });
    }

    static getAttachmentsFromMinute(minuteID) {
        if (minuteID) {
            let attachments = Attachment.findForMinutes(minuteID).fetch();
            attachments.forEach((file) => {
                let usr = Meteor.users.findOne(file.userId);
                file.username = usr.username;
            });
            return attachments;
        }
    }

    static getDocumentData(context) {
        let presentParticipants = context._participants.filter(participant => {
            return participant.present;
        });

        let absentParticipants = context._participants.filter(participant => {
            return !participant.present;
        });

        let discussedTopics = context._topics.filter(topic => {
            return !topic.isOpen;
        });

        let outstandingTopics = context._topics.filter(topic => {
            return (topic.isOpen && !topic.isSkipped);
        });

        return {
            minutesDate: context._minute.date,
            minutesGlobalNote: context._minute.globalNote,
            meetingSeriesName: context._meetingSeries.name,
            meetingSeriesProject: context._meetingSeries.project,
            meetingSeriesURL: GlobalSettings.getRootUrl('meetingseries/' + context._meetingSeries._id),
            minuteUrl: GlobalSettings.getRootUrl('minutesedit/' + context._minute._id),
            presentParticipants: context._userArrayToString(presentParticipants),
            absentParticipants: context._userArrayToString(absentParticipants),
            informedUsers: context._userArrayToString(context._informed),
            participantsAdditional: context._minute.participantsAdditional,
            discussedTopics: discussedTopics,
            skippedTopics: outstandingTopics,
            finalizedVersion: context._minute.finalizedVersion,
            attachments: this.getAttachmentsFromMinute(context._minute._id)
        };
    }

    static addHelperForHTMLMail(template, context) {
        template.addHelper('hasLabels', function() {
            return (this.labels.length > 0);
        });
        template.addHelper('formatLabels', function() {
            return LabelResolver.resolveAndformatLabelsString(this.labels, context._minute.parentMeetingSeriesID());
        });
        template.addHelper('doneActionItemClass', function() {
            if (this.isOpen !== undefined && this.isOpen === false) {
                return 'doneActionItem';
            }
        });
        template.addHelper('isActionItem', function() {
            return (this.itemType === 'actionItem');
        });
    }
}
