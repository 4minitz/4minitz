import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

import { GlobalSettings } from "../config/GlobalSettings";
import { DocumentGeneration } from "../documentGeneration";

import { InfoItemsMailHandler } from "./InfoItemsMailHandler";

export class SendAgendaMailHandler extends InfoItemsMailHandler {
  constructor(sender, minute) {
    super(
      sender,
      minute.getPersonsInformedWithEmail(Meteor.users),
      minute,
      minute.getOpenTopicsWithoutItems(),
      minute.parentMeetingSeries(),
      minute.getParticipants(Meteor.users),
      minute.getInformed(Meteor.users),
      "sendAgenda",
    );
  }

  _sendMail() {
    super._sendMail(this._getEmailData());
  }

  _getSubject() {
    return `${this._getSubjectPrefix()} (${i18n.__("Minutes.agenda")})`;
  }

  _getEmailData() {
    const unSkippedTopics = this._topics.filter((topic) => !topic.isSkipped);
    return {
      greetingLabel: i18n.__("Mail.greeting"),
      newLabel: i18n.__("Mail.newAgenda"),
      agendaLabel: i18n.__("Minutes.agenda"),
      minutesLabel: i18n.__("Mail.meeting"),
      minutesDateLabel: i18n.__("Minutes.date"),
      minutesDate: this._minute.date,
      minutesGlobalNoteLabel: i18n.__("Minutes.GlobalNotes.title"),
      minutesGlobalNote: this._minute.globalNote,
      meetingSeriesNameLabel: i18n.__("MeetingSeries.title"),
      meetingSeriesName: this._meetingSeries.name,
      meetingSeriesProjectLabel: i18n.__("MeetingSeries.team"),
      meetingSeriesProject: this._meetingSeries.project,
      meetingSeriesURL: GlobalSettings.getRootUrl(
        `meetingseries/${this._meetingSeries._id}`,
      ),
      minuteUrl: GlobalSettings.getRootUrl(`minutesedit/${this._minute._id}`),
      participantsLabel: i18n.__("Minutes.Participants.invited"),
      participants: this._userArrayToString(this._participants),
      participantsAdditionalLabel: i18n.__("Minutes.Participants.additional"),
      participantsAdditional: this._minute.participantsAdditional,
      topics: unSkippedTopics,
      attachmentsLabel: i18n.__("Minutes.attachments"),
      attachments: DocumentGeneration.getAttachmentsFromMinute(
        this._minute._id,
      ),
      linksLabel: i18n.__("Mail.links"),
      openSeriesLabel: i18n.__("Mail.openSeries"),
      openMinutesLabel: i18n.__("Mail.openMinutes"),
    };
  }

  getCountRecipients() {
    return this._recipients.length;
  }
}
