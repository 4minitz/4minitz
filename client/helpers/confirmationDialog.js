import { _ } from 'meteor/underscore';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';

const DIALOG_TEMPLATE = Template.confirmationDialog;

export class ConfirmationDialog {

    /**
     *
     * @param onSuccess
     * @param title
     * @param template
     * @param templateData
     * @param confirmButtonText
     * @returns {ConfirmationDialog}
     */
    static makeSuccessDialogWithTemplate(onSuccess, title, template, templateData, confirmButtonText = 'Confirm') {
        return new ConfirmationDialog({
            title: title,
            template: template,
            templateData: templateData,
            confirmButtonText: confirmButtonText,
            confirmButtonType: 'btn-success',
            content: ''
        }, {
            onSuccess: onSuccess
        });
    }

    static makeWarningDialogWithTemplate(onSuccess, title, template, templateData, confirmButtonText = 'Delete') {
        return new ConfirmationDialog({
            title: title,
            template: template,
            templateData: templateData,
            confirmButtonText: confirmButtonText,
            content: ''
        }, {
            onSuccess: onSuccess
        });
    }

    /**
     * @param title
     * @param content
     * @returns {ConfirmationDialog}
     */
    static makeInfoDialog(title, content) {
        return new ConfirmationDialog({
            title: title,
            content: content,
            confirmButtonText: 'OK',
            confirmButtonType: 'btn-info',
            showCancelButton: false
        });
    }

    /**
     * @param title
     * @param content
     * @returns {ConfirmationDialog}
     */
    static makeErrorDialog(title, content) {
        return new ConfirmationDialog({
            title: title,
            content: content,
            confirmButtonText: 'OK',
            showCancelButton: false
        });
    }

    constructor(options, callbacks = {}) {
        this.options = _.extend({
            title: 'Confirm delete',
            content: 'Are you sure to delete this?',
            template: null,
            templateData: {},
            confirmButtonText: 'Delete',
            confirmButtonType: 'btn-danger',
            showCancelButton: true
        }, options);
        this.callback = _.extend({
            onSuccess: function() {}
        }, callbacks);
        this.dialogTemplate = DIALOG_TEMPLATE;
    }

    setTemplate(template, data = {}) {
        this.options.template = template;
        this.options.templateData = data;
        this.options.content = '';
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
        this.dialogTmpl = Blaze.renderWithData(this.dialogTemplate, dialogData, $('body').get('0'));
        this.dialog = $(this.dialogTmpl.firstNode()).find('.modal');
    }

    _renderContentTemplate() {
        let tmplOpt = this.options.template;
        if (tmplOpt) {
            let template = (typeof tmplOpt === 'string') ? Template[tmplOpt] : tmplOpt;
            Blaze.renderWithData(template, this.options.templateData, this.dialog.find('.modal-body').get(0));
        }
    }

    _removeDialogOnHide() {
        this.dialog.on('hidden.bs.modal', () => {
            this.hide();
        });
    }

    _setCallbacks() {
        this.dialog.find('#confirmationDialogOK').off().click(() => {
            this.callback.onSuccess();
            return true;
        });
    }

    _makeDialogVisible() {
        this.dialog.modal('show');
    }

    hide() {
        if (this.dialogTmpl) {
            Blaze.remove(this.dialogTmpl);
        }
    }

}