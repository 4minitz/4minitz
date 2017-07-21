import { Meteor } from 'meteor/meteor';

import { Minutes } from './minutes';
import { Topic } from './topic';
import { Attachment } from './attachment';
import { GlobalSettings } from './config/GlobalSettings';
import { InfoItemFactory } from './InfoItemFactory';

import './helpers/promisedMethods';

export class DocumentGeneration {
    // ********** static methods ****************
    static async downloadMinuteProtocol(minuteID) {
        //Create HTML
        let htmldata = await Meteor.callPromise('documentgeneration.createHTML', minuteID);
        let currentMinute = new Minutes(minuteID);
        //Download File
        let fileBlob = new Blob([htmldata], {type:'octet/stream'});

        const filename = currentMinute.parentMeetingSeries().getRecord().name + '-' + Minutes.findOne(minuteID).date + '.html';

        if (window.navigator.msSaveOrOpenBlob)  // necessary for Internet Explorer, since it does'nt support the download-attribute for anchors
            window.navigator.msSaveBlob(fileBlob, filename);
        else {
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
            topic.labels = aTopicObj.getLabelsString(topic);
        });
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

        let attachments = Attachment.findForMinutes(context._minute._id).fetch();
        attachments.forEach((file) => {
            let usr = Meteor.users.findOne(file.userId);
            return file.username = usr.username;
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
            attachments: attachments
        };
    }

    static addHelperForHTMLMail(template, context) {
        template.addHelper('hasLabels', function() {
            return (this.labels.length > 0);
        });
        template.addHelper('formatLabels', function(parentTopicId) {
            let parentTopic = new Topic(context._minute, parentTopicId);
            let infoItemId = this._id;
            let infoItem = InfoItemFactory.createInfoItem(parentTopic, infoItemId);
            let labels = infoItem.getLabels(context._minute.parentMeetingSeriesID());
            let result = '';
            let first = true;
            labels.forEach(label => {
                if (first) {
                    first = false;
                } else {
                    result += ', ';
                }
                result += '#'+label.getName();
            });
            return result;
        });
    }
}
