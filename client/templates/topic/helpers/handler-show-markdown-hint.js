import {ConfirmationDialogFactory} from '../../../helpers/confirmationDialogFactory';

export const handlerShowMarkdownHint = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    ConfirmationDialogFactory
        .makeInfoDialog('Help for Markdown Syntax')
        .setTemplate('markdownHint')
        .show();
};