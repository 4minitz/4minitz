import { Template } from 'meteor/templating';
import {formatDateISO8601Time} from '../../imports/helpers/date';

Template.registerHelper('formatDateISO8601Time', (date) => {
    return formatDateISO8601Time(date);
});