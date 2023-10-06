import { Minutes } from "/imports/minutes";
import { Blaze } from "meteor/blaze";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { _ } from "meteor/underscore";

import { ParticipantsPreparer } from "./ParticipantsPreparer";

function select2search(
  selectResponsibles,
  delayTime,
  freeTextValidator,
  minuteID,
  topicOrItem,
) {
  let minute = new Minutes(minuteID);
  let preparer = new ParticipantsPreparer(
    minute,
    topicOrItem,
    Meteor.users,
    freeTextValidator,
  );
  let participants = preparer.getPossibleResponsibles();
  selectResponsibles.select2({
    placeholder: "Select...",
    tags: true, // Allow freetext adding
    tokenSeparators: [",", ";"],
    ajax: {
      delay: delayTime,
      transport: function (params, success, failure) {
        Meteor.call(
          "responsiblesSearch",
          params.data.q,
          participants,
          function (err, results) {
            if (err) {
              failure(err);
              return;
            }
            success(results);
          },
        );
      },
      processResults: function (data) {
        let results_participants = [];
        let results_other = [];
        _.each(data.results, function (result) {
          if (result.isParticipant) {
            results_participants.push({
              id: result.id,
              text: result.text,
            });
          } else
            results_other.push({
              id: result._id,
              text: result.fullname,
            });
        });
        // save the return value (when participants/other user are empty -> do
        // not show a group-name
        let returnValues = [];
        if (results_participants.length > 0)
          returnValues.push({
            text: "Participants",
            children: results_participants,
          });
        if (results_other.length > 0)
          returnValues.push({ text: "Other Users", children: results_other });

        return {
          results: returnValues,
        };
      },
    },
  });
}

export function configureSelect2Responsibles(
  SelectResponsibleElementID,
  topicOrItemDoc,
  freeTextValidator,
  _minutesID,
  topicOrItem,
) {
  let selectResponsibles = $(`#${SelectResponsibleElementID}`);
  selectResponsibles
    .find("option") // clear all <option>s
    .remove();
  let delayTime = Meteor.settings.public.isEnd2EndTest ? 0 : 50;

  select2search(
    selectResponsibles,
    delayTime,
    freeTextValidator,
    _minutesID,
    topicOrItem,
  );
  let data = { options: [] };
  if (topicOrItemDoc !== undefined) {
    let responsibles = topicOrItemDoc.responsibles || [];
    responsibles.forEach((responsibleId) => {
      let responsibleUser = Meteor.users.findOne(responsibleId);
      if (!responsibleUser) {
        // free text user
        responsibleUser = { fullname: responsibleId };
      } else {
        Minutes.formatResponsibles(
          responsibleUser,
          "username",
          responsibleUser.profile,
        );
      }
      data.options.push({
        optionId: responsibleId,
        optionText: responsibleUser.fullname,
      });
    });
    Blaze.renderWithData(
      Template["optionsElement"],
      data,
      document.getElementById(SelectResponsibleElementID),
    );
  }
  selectResponsibles.trigger("change");
}
