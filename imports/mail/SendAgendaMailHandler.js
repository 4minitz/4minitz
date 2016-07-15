import { InfoItemsMailHandler } from './InfoItemsMailHandler'
import { GlobalSettings } from './../GlobalSettings'

export class SendAgendaMailHandler extends InfoItemsMailHandler {

    constructor(sender, minute) {
        super(sender, minute.getPersonsInformedWithEmail(Meteor.users), minute, minute.getTopicsWithoutItems(),
            minute.parentMeetingSeries(), minute.getParticipants(Meteor.users), 'sendAgenda');
    }

    _getSubjectPrefix() {
        return super._getSubjectPrefix() + " (Agenda)";
    }


    _getEmailData() {
        return {
            minutesDate: this._minute.date,
            meetingSeriesName: this._meetingSeries.name,
            meetingSeriesProject: this._meetingSeries.project,
            meetingSeriesURL: GlobalSettings.getRootUrl("meetingseries/" + this._meetingSeries._id),
            minuteUrl: GlobalSettings.getRootUrl("minutesedit/" + this._minute._id),
            participants: this._participantsArrayToString(this._participants),
            participantsAdditional: this._minute.participantsAdditional,
            topics: this._topics
        };
    }

    getCountRecipients() {
        return this._recipients.length;
    }

}