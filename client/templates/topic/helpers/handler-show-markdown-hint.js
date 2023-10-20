import { i18n } from "meteor/universe:i18n";
import { ConfirmationDialogFactory } from "../../../helpers/confirmationDialogFactory";

export const handlerShowMarkdownHint = (evt) => {
  evt.preventDefault();
  evt.stopPropagation();
  ConfirmationDialogFactory.makeInfoDialog(i18n.__("Item.markdownHint"))
    .setTemplate("markdownHint")
    .show();
};
