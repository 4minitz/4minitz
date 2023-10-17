/**
 * This class collects helper methods for HTML meeting minutes to
 *    - download meeting minute files as HTML
 *    - send meeting minutes as HTML eMails
 */

import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { i18n } from "meteor/universe:i18n";
import "./helpers/promisedMethods";

import { Attachment } from "./attachment";
import { DocumentsCollection } from "./collections/documentgeneration_private.js";
import { GlobalSettings } from "./config/GlobalSettings";
import { Minutes } from "./minutes";
import { LabelResolver } from "./services/labelResolver";
import { ResponsibleResolver } from "./services/responsibleResolver";

export class DocumentGeneration {
  // ********** static methods ****************
  static async downloadMinuteProtocol(minuteID, noProtocolExistsDialog) {
    // This Function dynamically generates an HTML document for instant-download
    const generateAndDownloadHTML = async function () {
      const minuteID = FlowRouter.getParam("_id"); // eslint-disable-line

      // Create HTML
      const htmldata = await Meteor.callPromise(
        "documentgeneration.createHTML",
        minuteID,
      );
      const currentMinute = new Minutes(minuteID);
      // Download File
      const fileBlob = new Blob([htmldata], { type: "octet/stream" });

      const filename = `${DocumentGeneration.calcFileNameforMinute(
        currentMinute,
      )}.html`;

      if (window.navigator.msSaveOrOpenBlob) {
        // necessary for Internet Explorer, since it does'nt support the
        // download-attribute for anchors
        window.navigator.msSaveBlob(fileBlob, filename);
        return;
      }
      const fileurl = window.URL.createObjectURL(fileBlob);

      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = fileurl;
      a.download = filename;
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(fileurl);
      }, 250);
    };
    noProtocolExistsDialog(generateAndDownloadHTML);
  }

  static getProtocolForMinute(minuteId) {
    return DocumentsCollection.findOne({ "meta.minuteId": minuteId });
  }

  static calcFileNameforMinute(minutesObj) {
    if (!minutesObj) {
      return;
    }
    const fileName = minutesObj.parentMeetingSeries().getRecord().name;
    return `${fileName}-${minutesObj.date}`;
  }
  // ********** static methods for generation of HTML Document ****************
  static generateResponsibleStringsForTopic(context) {
    context._topics.forEach((topic) => {
      const responsible =
        ResponsibleResolver.resolveAndformatResponsiblesString(
          topic.responsibles,
        );
      topic.responsiblesString = responsible ? `(${responsible})` : "";
      topic.labelsString = LabelResolver.resolveAndformatLabelsString(
        topic.labels,
        context._meetingSeries._id,
      );

      // inject responsible as readable short user names to all action items of
      // this topic
      topic.infoItems.forEach((item) => {
        if (item.itemType === "actionItem") {
          const responsible =
            ResponsibleResolver.resolveAndformatResponsiblesString(
              item.responsibles,
              "@",
            );
          item.responsiblesString = responsible ? `(${responsible})` : "";
        }
      });
    });
  }

  static getAttachmentsFromMinute(minuteID) {
    if (!minuteID) {
      return;
    }
    const attachments = Attachment.findForMinutes(minuteID).fetch();
    attachments.forEach((file) => {
      const usr = Meteor.users.findOne(file.userId);
      file.username = usr.username;
    });
    return attachments;
  }

  static getDocumentData(context) {
    const presentParticipants = context._participants.filter((participant) => {
      return participant.present;
    });

    const absentParticipants = context._participants.filter((participant) => {
      return !participant.present;
    });

    const discussedTopics = context._topics.filter((topic) => {
      return !topic.isOpen;
    });

    const outstandingTopics = context._topics.filter((topic) => {
      return topic.isOpen && !topic.isSkipped;
    });

    return {
      greetingLabel: i18n.__("Mail.greeting"),
      newLabel: i18n.__("Mail.newMinutes"),
      meetingLabel: i18n.__("Mail.meeting"),
      minutesDateLabel: i18n.__("Minutes.date"),
      minutesDate: context._minute.date,
      minutesGlobalNoteLabel: i18n.__("Minutes.GlobalNotes.title"),
      minutesGlobalNote: context._minute.globalNote,
      meetingSeriesNameLabel: i18n.__("MeetingSeries.title"),
      meetingSeriesName: context._meetingSeries.name,
      meetingSeriesProjectLabel: i18n.__("MeetingSeries.team"),
      meetingSeriesProject: context._meetingSeries.project,
      meetingSeriesURL: GlobalSettings.getRootUrl(
        `meetingseries/${context._meetingSeries._id}`,
      ),
      minuteUrl: GlobalSettings.getRootUrl(
        `minutesedit/${context._minute._id}`,
      ),
      presentParticipantsLabel: i18n.__("Minutes.Participants.present"),
      presentParticipants: context._userArrayToString(presentParticipants),
      absentParticipantsLabel: i18n.__("Minutes.Participants.absent"),
      absentParticipants: context._userArrayToString(absentParticipants),
      informedUsersLabel: i18n.__("Minutes.Participants.informed"),
      informedUsers: context._userArrayToString(context._informed),
      participantsAdditionalLabel: i18n.__("Minutes.Participants.additional"),
      participantsAdditional: context._minute.participantsAdditional,
      discussedTopicsLabel: i18n.__("Mail.discussedTopics"),
      discussedTopics,
      skippedTopicsLabel: i18n.__("Mail.skippedTopics"),
      skippedTopics: outstandingTopics,
      actionItemLabel: i18n.__("Item.action"),
      noneLabel: i18n.__("Mail.none"),
      doneLabel: i18n.__("Item.done"),
      pinnedLabel: i18n.__("Item.pinned"),
      finalizedVersionLabel: i18n.__("Minutes.version"),
      finalizedVersionTagLabel: i18n.__("Minutes.versionTag"),
      finalizedVersion: context._minute.finalizedVersion,
      attachmentsLabel: i18n.__("Minutes.attachments"),
      attachments: this.getAttachmentsFromMinute(context._minute._id),
      linksLabel: i18n.__("Mail.links"),
      openSeriesLabel: i18n.__("Mail.openSeries"),
      openMinutesLabel: i18n.__("Mail.openMinutes"),
    };
  }

  static addHelperForHTMLMail(template, context) {
    template.addHelper("hasLabels", function () {
      return this.labels.length > 0;
    });
    template.addHelper("formatLabels", function () {
      return LabelResolver.resolveAndformatLabelsString(
        this.labels,
        context._minute.parentMeetingSeriesID(),
      );
    });
    template.addHelper("doneActionItemClass", function () {
      if (this.isOpen !== undefined && this.isOpen === false) {
        return "doneActionItem";
      }
    });
    template.addHelper("isActionItem", function () {
      return this.itemType === "actionItem";
    });
  }
}
