import { _ } from 'meteor/underscore';
import { Blaze } from 'meteor/blaze';

const DIALOG_TEMPLATE = Template.confirmationDialog;

export class ConfirmationDialog {

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