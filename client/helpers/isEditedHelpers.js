import { Meteor } from 'meteor/meteor';
import {formatDateISO8601Time} from '../../imports/helpers/date';
import {ConfirmationDialogFactory} from './confirmationDialogFactory';

export function isEditedHandling(element, unset, setIsEdited, evt, confirmationDialogTemplate) {
    if ((element.isEditedBy != undefined && element.isEditedDate != undefined)) {

        let user = Meteor.users.findOne({_id: element.isEditedBy});

        let tmplData = {
            isEditedBy: user.username,
            isEditedDate: formatDateISO8601Time(element.isEditedDate)
        };

        ConfirmationDialogFactory.makeWarningDialogWithTemplate(
            unset,
            'Edit despite existing editing',
            confirmationDialogTemplate,
            tmplData,
            'Edit anyway'
        ).show();

        evt.preventDefault();
    }
    else {
        setIsEdited();
    }
}