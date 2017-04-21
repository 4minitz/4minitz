import { Meteor } from 'meteor/meteor';

import { TopicItemsMailHandler } from './TopicItemsMailHandler'
import { GlobalSettings } from '../config/GlobalSettings'
import { Topic } from './../topic'
import { Attachment } from '../attachment';

export class InfoItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipients, minute, topics, meetingSeries, participants, informed, template = 'publishInfoItems') {
        super(sender, recipients, minute, template);
        this._topics = topics;
        this._sender = sender;
        this._minute = minute;
        this._meetingSeries = meetingSeries;
        this._participants = participants;
        this._informed = informed;
    }

    _getSubject() {
        return this._getSubjectPrefix()  + " (Meeting Minutes V"+this._minute.finalizedVersion+")";
    }

    _sendMail() {
        let mailSubject = this._getSubject();

        // Generate responsibles strings for all topics
        this._topics.forEach(topic => {
            let aTopicObj = new Topic (this._minute._id, topic);
            topic.responsiblesString = "";
            if (aTopicObj.hasResponsibles()) {
                topic.responsiblesString = "("+aTopicObj.getResponsiblesString()+")";
            }
        });

        this._buildMail(
            mailSubject,
            this._getEmailData()
        );
    }

    _getEmailData() {
        let presentParticipants = this._participants.filter(participant => {
            return participant.present;
        });

        let absentParticipants = this._participants.filter(participant => {
            return !participant.present;
        });

        let discussedTopics = this._topics.filter(topic => {
            return !topic.isOpen;
        });

        let skippedTopics = this._topics.filter(topic => {
            return topic.isOpen;
        });

        let attachments = Attachment.findForMinutes(this._minute._id).fetch();
        attachments.forEach((file) => {
            let usr = Meteor.users.findOne(file.userId);
            return file.username = usr.username;
        });

        return {
            minutesDate: this._minute.date,
            minutesGlobalNote: this._minute.globalNote,
            meetingSeriesName: this._meetingSeries.name,
            meetingSeriesProject: this._meetingSeries.project,
            meetingSeriesURL: GlobalSettings.getRootUrl("meetingseries/" + this._meetingSeries._id),
            minuteUrl: GlobalSettings.getRootUrl("minutesedit/" + this._minute._id),
            presentParticipants: this._userArrayToString(presentParticipants),
            absentParticipants: this._userArrayToString(absentParticipants),
            informedUsers: this._userArrayToString(this._informed),
            participantsAdditional: this._minute.participantsAdditional,
            discussedTopics: discussedTopics,
            skippedTopics: skippedTopics,
            finalizedVersion: this._minute.finalizedVersion,
            attachments: attachments
        };
    }

    _userArrayToString(users) {
        return users.map(function(user){
            return user.name;
        }).join(", ");
    }
}
