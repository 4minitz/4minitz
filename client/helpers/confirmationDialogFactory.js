import { i18n } from "meteor/universe:i18n";

import { ConfirmationDialog } from "./confirmationDialog";

export class ConfirmationDialogFactory {
  /**
   * @returns {ConfirmationDialog}
   */
  static makeSuccessDialogWithTemplate(
    onSuccess,
    title,
    template,
    templateData,
    confirmButtonText = i18n.__("Buttons.confirm"),
  ) {
    return new ConfirmationDialog(
      {
        title,
        template,
        templateData,
        confirmButtonText,
        confirmButtonType: "btn-success",
        content: "",
      },
      {
        onSuccess,
      },
    );
  }

  /**
   * @returns {ConfirmationDialog}
   */
  static makeWarningDialogWithTemplate(
    onSuccess,
    title,
    template,
    templateData,
    confirmButtonText = i18n.__("Buttons.delete"),
  ) {
    return new ConfirmationDialog(
      {
        title,
        template,
        templateData,
        confirmButtonText,
        content: "",
      },
      {
        onSuccess,
      },
    );
  }

  /**
   * @returns {ConfirmationDialog}
   */
  static makeSuccessDialog(
    onSuccess,
    title,
    content,
    templateData,
    confirmButtonText = i18n.__("Buttons.confirm"),
  ) {
    return new ConfirmationDialog(
      {
        title,
        templateData,
        confirmButtonText,
        confirmButtonType: "btn-success",
        content,
      },
      {
        onSuccess,
      },
    );
  }

  /**
   * @returns {ConfirmationDialog}
   */
  static makeWarningDialog(
    onSuccess,
    title,
    content,
    templateData,
    confirmButtonText,
  ) {
    return new ConfirmationDialog(
      {
        title: title ? title : i18n.__("Dialog.ConfirmDelete.title"),
        content: content ? content : i18n.__("Dialog.ConfirmDelete.body"),
        templateData,
        confirmButtonText: confirmButtonText
          ? confirmButtonText
          : i18n.__("Buttons.delete"),
      },
      {
        onSuccess,
      },
    );
  }

  /**
   * @returns {ConfirmationDialog}
   */
  static makeInfoDialog(title, content) {
    return new ConfirmationDialog({
      title,
      content,
      confirmButtonText: i18n.__("Buttons.ok"),
      confirmButtonType: "btn-info",
      showCancelButton: false,
    });
  }

  /**
   * @returns {ConfirmationDialog}
   */
  static makeErrorDialog(title, content) {
    return new ConfirmationDialog({
      title,
      content,
      confirmButtonText: i18n.__("Buttons.ok"),
      showCancelButton: false,
    });
  }
}
