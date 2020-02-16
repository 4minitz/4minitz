import { ConfirmationDialog } from './confirmationDialog';
import { i18n } from 'meteor/universe:i18n';

export class ConfirmationDialogFactory {

    /**
     * @returns {ConfirmationDialog}
     */
    static makeSuccessDialogWithTemplate(onSuccess, title, template, templateData,
        confirmButtonText = i18n.__('Buttons.confirm')) {
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
        confirmButtonText = i18n.__('Buttons.delete')) {
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