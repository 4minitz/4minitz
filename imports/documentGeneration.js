/**
 * This class collects helper methods for HTML meeting minutes to
 *    - download meeting minute files as HTML
 *    - send meeting minutes as HTML eMails
 */

import { Meteor } from 'meteor/meteor';

import { Minutes } from './minutes';
import { Attachment } from './attachment';
import { GlobalSettings } from './config/GlobalSettings';
import { DocumentsCollection } from './collections/documentgeneration_private.js';

import './helpers/promisedMethods';
import {LabelResolver} from './services/labelResolver';
import {ResponsibleResolver} from './services/responsibleResolver';

export class DocumentGeneration {
    // ********** static methods ****************
    static async downloadMinuteProtocol(minuteID, noProtocolExistsDialog) {
        // This Function dynamically generates an HTML document for instant-download
        let generateAndDownloadHTML = async function() {
            let minuteID = FlowRouter.getParam('_id'); //eslint-disable-line

            //Create HTML
            let htmldata = await Meteor.callPromise('documentgeneration.createHTML', minuteID);
            let currentMinute = new Minutes(minuteID);
            //Download File
            let fileBlob = new Blob([htmldata], {type:'octet/stream'});

            const filename = DocumentGeneration.calcFileNameforMinute(currentMinute) + '.html';

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
        };
        noProtocolExistsDialog(generateAndDownloadHTML);
    }
    
    static getProtocolForMinute(minuteId) {
        return DocumentsCollection.findOne({'meta.minuteId': minuteId});
    }

    static saveProtocol(minutesObj) {
        return Meteor.callPromise('documentgeneration.createAndStoreFile', minutesObj);
    }

    static removeProtocol(minutesObj) {
        return Meteor.callPromise('documentgeneration.removeFile', minutesObj);
    }

    static calcFileNameforMinute(minutesObj) {
        if (minutesObj) {
            let fileName = minutesObj.parentMeetingSeries().getRecord().name;
            fileName = fileName + '-' + minutesObj.date;
            return fileName;
        }
    }
    // ********** static methods for generation of HTML Document ****************
    static generateResponsibleStringsForTopic(context) {
        context._topics.forEach(topic => {
            const responsible = ResponsibleResolver.resolveAndformatResponsiblesString(topic.responsibles);
            topic.responsiblesString = (responsible) ?  `(${responsible})` : '';
            topic.labelsString = LabelResolver.resolveAndformatLabelsString(topic.labels, context._meetingSeries._id);

            // inject responsible as readable short user names to all action items of this topic
            topic.infoItems.forEach((item) => {
                if (item.itemType === 'actionItem') {
                    const responsible = ResponsibleResolver.resolveAndformatResponsiblesString(item.responsibles, '@');
                    item.responsiblesString = (responsible) ?  `(${responsible})` : '';
                }
            });
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
