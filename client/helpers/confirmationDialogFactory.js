import { ConfirmationDialog } from './confirmationDialog';
import { i18n } from 'meteor/universe:i18n';

export class ConfirmationDialogFactory {

    /**
     * @returns {ConfirmationDialog}
     */
    static makeSuccessDialogWithTemplate(onSuccess, title, template, templateData,
        confirmButtonText = i18n.__('Buttons.confirm'))
    {
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

    /**
     * @returns {ConfirmationDialog}
     */
    static makeWarningDialogWithTemplate(onSuccess, title, template, templateData, 
        confirmButtonText = i18n.__('Buttons.delete'))
    {
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
     * @returns {ConfirmationDialog}
     */
    static makeSuccessDialog(onSuccess, title, content, templateData,
        confirmButtonText = i18n.__('Buttons.confirm'))
    {
        return new ConfirmationDialog({
            title: title,
            templateData: templateData,
            confirmButtonText: confirmButtonText,
            confirmButtonType: 'btn-success',
            content: content
        }, {
            onSuccess: onSuccess
        });
    }


    /**
     * @returns {ConfirmationDialog}
     */
    static makeWarningDialog(onSuccess, title, content, templateData, confirmButtonText)
    {
        return new ConfirmationDialog({
            title: title ? title : i18n.__('Dialog.ConfirmDelete.title'),
            content: content ? content : i18n.__('Dialog.ConfirmDelete.body'),
            templateData: templateData,
            confirmButtonText: confirmButtonText ? confirmButtonText : i18n.__('Buttons.delete')
        }, {
            onSuccess: onSuccess
        });
    }


    /**
     * @returns {ConfirmationDialog}
     */
    static makeInfoDialog(title, content) {
        return new ConfirmationDialog({
            title: title,
            content: content,
            confirmButtonText: i18n.__('Buttons.ok'),
            confirmButtonType: 'btn-info',
            showCancelButton: false
        });
    }

    /**
     * @returns {ConfirmationDialog}
     */
    static makeErrorDialog(title, content) {
        return new ConfirmationDialog({
            title: title,
            content: content,
            confirmButtonText: i18n.__('Buttons.ok'),
            showCancelButton: false
        });
    }
}