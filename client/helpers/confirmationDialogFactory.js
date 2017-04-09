import { ConfirmationDialog } from './confirmationDialog';

export class ConfirmationDialogFactory {

    /**
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

    /**
     * @returns {ConfirmationDialog}
     */
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
}