import { Meteor } from 'meteor/meteor';

import { InfoItemsMailHandler } from './InfoItemsMailHandler';
import { GlobalSettings } from './../GlobalSettings';
import { Attachment } from '../attachment';

export class SendAgendaMailHandler extends InfoItemsMailHandler {

    constructor(sender, minute) {
        super(sender, minute.getPersonsInformedWithEmail(Meteor.users), minute, minute.getTopicsWithoutItems(),
            minute.parentMeetingSeries(), minute.getParticipants(Meteor.users), 'sendAgenda');
    }

    _getSubject() {
        return this._getSubjectPrefix() + " (Agenda)";
    }


    _getEmailData() {
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
            participants: this._participantsArrayToString(this._participants),
            participantsAdditional: this._minute.participantsAdditional,
            topics: this._topics,
            attachments: attachments
        };
    }

    getCountRecipients() {
        return this._recipients.length;
    }

}