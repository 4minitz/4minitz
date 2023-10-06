import { Meteor } from "meteor/meteor";
import { formatDateISO8601Time } from "../../imports/helpers/date";
import { ConfirmationDialogFactory } from "./confirmationDialogFactory";
import { User } from "/imports/user";
import { i18n } from "meteor/universe:i18n";

export function isEditedHandling(
  element,
  unset,
  setIsEdited,
  evt,
  confirmationDialogTemplate,
) {
  // Attention: .isEditedBy and .isEditedDate may be null!
  if (element.isEditedBy != undefined && element.isEditedDate != undefined) {
    const user = Meteor.users.findOne({ _id: element.isEditedBy });

    const tmplData = {
      isEditedByName: User.PROFILENAMEWITHFALLBACK(user),
      isEditedDate: formatDateISO8601Time(element.isEditedDate),
    };

    ConfirmationDialogFactory.makeWarningDialogWithTemplate(
      unset,
      i18n.__("Dialog.IsEditedHandling.title"),
      confirmationDialogTemplate,
      tmplData,
      i18n.__("Dialog.IsEditedHandling.button"),
    ).show();

    evt.preventDefault();
  } else {
    setIsEdited();
  }
}
