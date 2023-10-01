import { Meteor } from "meteor/meteor";

import { Minutes } from "./../minutes";
import { UserRoles } from "./../userroles";
import { TemplateRenderer } from "./../server_side_templates/TemplateRenderer";
import { DocumentGeneration } from "./../documentGeneration";

import { FilesCollection } from "meteor/ostrio:files";
import { extendedPublishSubscribeHandler } from "./../helpers/extendedPublishSubscribe";
import { User } from "../user";

export let DocumentsCollection = new FilesCollection({
  collectionName: "DocumentsCollection",
  allowClientCode: false,
  permissions: 0o0600, // #Security: make uploaded files "chmod 600' only readable for server user
  storagePath: Meteor.isServer ? createDocumentStoragePath : undefined, //eslint-disable-line

  // #Security: onBeforeUpload
  // Here we check for upload rights of user. User must be moderator for meeting series.
  // This will be run in method context on client and(!) server by the Meteor-Files package
  // So, server will always perform the last ultimate check!
  onBeforeUpload: function (file) {
    if (!Meteor.settings.public.docGeneration.enabled) {
      return "Document Generation not enabled in settings.json";
    }
    if (!Meteor.userId()) {
      return "Document Generation not possible. No user logged in.";
    }
    if (file.meta === undefined || file.meta.meetingSeriesID === undefined) {
      return "Document Generation not possible. File has no target meeting series.";
    }
    if (file.meta.minuteID === undefined) {
      return "Document Generation not possible. File has no target minute.";
    }
    if (file.meta.minuteDate === undefined) {
      return "Document Generation not possible. File has no minute date.";
    }
    let ur = new UserRoles();
    if (!ur.isModeratorOf(file.meta.meetingSeriesID)) {
      return "Document Genration not possible. User is not Moderator of this meeting series.";
    }
    let min = new Minutes(file.meta.minuteID);
    if (!min.isFinalized) {
      return "Document Generation not possible. Minutes are not finalized.";
    }

    return true;
  },

  onAfterUpload: function (file) {
    console.log(
      "Successfully created protocol: " + file.name + " to " + file.path,
    );
    DocumentsCollection.update(file._id, {
      $set: { "meta.timestamp": new Date() },
    });
  },

  onBeforeRemove: function (file) {
    if (!Meteor.userId()) {
      return "Document could not be removed. No user logged in.";
    }
    let ur = new UserRoles();
    if (!ur.isModeratorOf(file.meta.meetingSeriesID)) {
      return "Document could not be removed. User is not Moderator of this meeting series.";
    }
  },

  // #Security: downloadCallback
  // Here we check for download rights of user, which equals to the "invited" role - or better.
  // This will be run in method context on client and(!) server by the Meteor-Files package
  // So, server will always perform the last ultimate check!
  downloadCallback: function (file) {
    if (!this.userId) {
      console.log("Protocol download prohibited. User not logged in.");
      return false;
    }
    if (file.meta === undefined || file.meta.meetingSeriesId === undefined) {
      console.log(
        "Protocol download prohibited. File without parent meeting series.",
      );
      return false;
    }
    if (file.meta.minuteId === undefined) {
      console.log(
        "Protocol download prohibited. File without minute related to.",
      );
      return false;
    }

    let ur = new UserRoles(this.userId);
    if (!ur.hasViewRoleFor(file.meta.meetingSeriesId)) {
      console.log(
        "Protocol download prohibited. User has no view role for meeting series: " +
          file.meta.meetingSeriesId,
      );
      return false;
    }
    return true; // OK - Download allowed
  },
});

extendedPublishSubscribeHandler.publishByMeetingSeriesOrMinute(
  "files.protocols.all",
  DocumentsCollection,
  "meta.meetingSeriesId",
  "meta.minuteId",
);

Meteor.methods({
  "documentgeneration.createHTML"(minuteID) {
    if (Meteor.isClient) {
      return;
    }

    //Check DocumentGeneration is enabled and user has rights to continue
    if (Meteor.settings.public.docGeneration.enabled !== true) {
      return;
    }

    if (!Meteor.userId()) {
      throw new Meteor.Error(
        "not-authorized",
        "You are not authorized to perform this action.",
      );
    }

    let minute = new Minutes(minuteID);
    let userRoles = new UserRoles(Meteor.userId());
    if (!userRoles.isInvitedTo(minute.parentMeetingSeriesID())) {
      throw new Meteor.Error(
        "Cannot download this minute",
        "You are not invited to the meeting series.",
      );
    }

    let documentHandler = {
      _topics: minute.topics,
      _minute: minute,
      _meetingSeries: minute.parentMeetingSeries(),
      _participants: minute.getParticipants(Meteor.users),
      _informed: minute.getInformed(Meteor.users),
      _userArrayToString: function (users) {
        return users
          .map(function (user) {
            return User.PROFILENAMEWITHFALLBACK(user);
          })
          .join("; ");
      },
    };

    DocumentGeneration.generateResponsibleStringsForTopic(documentHandler);
    let templateData = DocumentGeneration.getDocumentData(documentHandler);

    let tmplRenderer = new TemplateRenderer(
      "publishInfoItems",
      "server_templates/email",
    ).addData("name", "");
    tmplRenderer.addDataObject(templateData);
    DocumentGeneration.addHelperForHTMLMail(tmplRenderer, documentHandler);
    return tmplRenderer.render();
  },

  "documentgeneration.createAndStoreFile"(minutesId) {
    if (Meteor.isClient) {
      return;
    }
    if (!Meteor.settings.public.docGeneration.enabled) {
      return;
    }

    let minutesObj = new Minutes(minutesId);
    //Security checks will be done in the onBeforeUpload-Hook

    //this variable should be overwritten by the specific implementation of storing files based on their format
    //for this purpose they'll receive two parameters: the html-content as a string and the minute as a object
    let storeFileFunction = undefined;
    let fileName = DocumentGeneration.calcFileNameforMinute(minutesObj);
    let metaData = {
      minuteId: minutesObj._id,
      meetingSeriesId: minutesObj.parentMeetingSeriesID(),
      minuteDate: minutesObj.date,
    };

    // implementation of html storing
    if (Meteor.settings.public.docGeneration.format === "html") {
      storeFileFunction = (htmldata, fileName, metaData) => {
        console.log("Protocol generation to file: ", fileName);
        DocumentsCollection.write(
          new Buffer(htmldata),
          { fileName: fileName + ".html", type: "text/html", meta: metaData },
          function (error) {
            if (error) {
              throw new Meteor.Error(error);
            }
          },
        );
      };
    }

    // implementation of pdf storing
    if (
      Meteor.settings.public.docGeneration.format === "pdf" ||
      Meteor.settings.public.docGeneration.format === "pdfa"
    ) {
      storeFileFunction = (htmldata, fileName, metaData) => {
        let finalPDFOutputPath = convertHTML2PDF(htmldata, fileName, metaData); //eslint-disable-line
        console.log(
          "Protocol generation to file: ",
          finalPDFOutputPath,
          fileName,
        );
        DocumentsCollection.addFile(
          finalPDFOutputPath,
          {
            fileName: fileName + ".pdf",
            type: "application/pdf",
            meta: metaData,
          },
          function (error) {
            if (error) {
              throw new Meteor.Error(error);
            }
          },
        );
      };
    }

    if (!storeFileFunction) {
      throw new Meteor.Error(
        "Cannot create protocol",
        "The protocol could not be created since the format assigned in the settings.json is not supported: " +
          Meteor.settings.public.docGeneration.format,
      );
    }

    //generate and store protocol
    try {
      let htmldata = Meteor.call(
        "documentgeneration.createHTML",
        minutesObj._id,
      ); // this one will run synchronous
      storeFileFunction(htmldata, fileName, metaData);
    } catch (error) {
      console.error("Error at Protocol generation:");
      let errormsg = error.reason ? error.reason : error;
      console.error(errormsg);
      throw new Meteor.Error("runtime-error", errormsg.message);
    }
  },

  "documentgeneration.removeFile"(minutesId) {
    if (Meteor.isServer) {
      //Security checks will be done in the onBeforeRemove-Hook
      DocumentsCollection.remove(
        { "meta.minuteId": minutesId },
        function (error) {
          if (error) {
            throw new Meteor.Error(
              "Protocol could not be deleted, error: " + error.reason,
            );
          }
        },
      );
    }
  },
});
