import { Template } from 'meteor/templating';
import {formatDateISO8601Time} from '../../imports/helpers/date';

Template.registerHelper('formatDateISO8601Time', (date) => {
    return formatDateISO8601Time(date);
});

Template.registerHelper('formateUpdatedHint', (date, username) => {
    return `Updated ${formatDateISO8601Time(date)}` + ((username) ? ` by ${username}` : '');
});