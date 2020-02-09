import { Meteor } from 'meteor/meteor';
import {formatDateISO8601Time} from '../../imports/helpers/date';
import {ConfirmationDialogFactory} from './confirmationDialogFactory';
import { User } from '/imports/user';

export function isEditedHandling(element, unset, setIsEdited, evt, confirmationDialogTemplate) {
    // Attention: .isEditedBy and .isEditedDate may be null!
    if ((element.isEditedBy != undefined && element.isEditedDate != undefined)) {

        let user = new User(element.isEditedBy);
        if (!user.OK) {
            console.log('Warning: could not find user for ID:'+element.isEditedBy);
        }

        let tmplData = {
            isEditedByName: user.profileNameWithFallback(),
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