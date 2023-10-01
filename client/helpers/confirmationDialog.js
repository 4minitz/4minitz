import { _ } from "lodash";
import { Blaze } from "meteor/blaze";
import { $ } from "meteor/jquery";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

const DIALOG_TEMPLATE = Template.confirmationDialog;

export class ConfirmationDialog {
  constructor(options, callbacks = {}) {
    this.options = _.extend(
      {
        title: i18n.__("Dialog.ConfirmDelete.title"),
        content: i18n.__("Dialog.ConfirmDelete.body"),
        template: null, // if given, replaces '.modal-body' of DIALOG_TEMPLATE
        templateData: {},
        confirmButtonText: i18n.__("Buttons.delete"),
        confirmButtonType: "btn-danger",
        showCancelButton: true,
      },
      options,
    ); // overwrite above defaults with given options
    this.callback = _.extend(
      {
        onSuccess: function () {},
      },
      callbacks,
    );
    this.dialogTemplate = DIALOG_TEMPLATE;
  }

  setTemplate(template, data = {}) {
    this.options.template = template;
    this.options.templateData = data;
    this.options.content = "";
    return this;
  }

  show() {
    this._renderDialog();
    this._renderContentTemplate();
    this._removeDialogOnHide();
    this._setCallbacks();
    this._makeDialogVisible();
  }

  _renderDialog() {
    let dialogData = this.options;
    this.dialogTmpl = Blaze.renderWithData(
      this.dialogTemplate,
      dialogData,
      $("body").get("0"),
    );
    this.dialog = $(this.dialogTmpl.firstNode()).find(".modal");
  }

  _renderContentTemplate() {
    let tmplOpt = this.options.template;
    if (tmplOpt) {
      let template = typeof tmplOpt === "string" ? Template[tmplOpt] : tmplOpt;
      Blaze.renderWithData(
        template,
        this.options.templateData,
        this.dialog.find(".modal-body").get(0),
      );
    }
  }

  _removeDialogOnHide() {
    this.dialog.on("hidden.bs.modal", () => {
      this.hide();
      if ($(".modal:visible").length) {
        $("body").addClass("modal-open");
      }
    });
  }

  _setCallbacks() {
    this.dialog
      .find("#confirmationDialogOK")
      .off()
      .click(() => {
        this.callback.onSuccess();
        return true;
      });
  }

  _makeDialogVisible() {
    this.dialog.modal("show");
  }

  hide() {
    if (this.dialogTmpl) {
      Blaze.remove(this.dialogTmpl);
    }
  }
}
