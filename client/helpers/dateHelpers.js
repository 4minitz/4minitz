import { Template } from 'meteor/templating';
import {formatDateISO8601Time} from '../../imports/helpers/date';

Template.registerHelper('formatDateISO8601Time', (date) => {
    return formatDateISO8601Time(date);
});

Template.registerHelper('formateUpdatedHint', (dateCreate, userCreate, dateUpd, userUpd) => {
    const dateCreateStr = formatDateISO8601Time(dateCreate);
    const dateUpdStr = formatDateISO8601Time(dateUpd);

    let tooltip = `Created ${dateCreateStr}` + ((userCreate) ? ` by ${userCreate}` : '');
    if (dateUpd && dateUpdStr > dateCreateStr) {
        tooltip = tooltip + `\nUpdated ${dateUpdStr}` + ((userUpd) ? ` by ${userUpd}` : '');
    }
    return tooltip;
});
