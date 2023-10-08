import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { formatDateISO8601Time } from "../../imports/helpers/date";

Template.registerHelper("formatDateISO8601Time", (date) => {
  return formatDateISO8601Time(date);
});

Template.registerHelper(
  "formateUpdatedHint",
  (dateCreate, userCreate, dateUpd, userUpd) => {
    const dateCreateStr = formatDateISO8601Time(dateCreate);
    const dateUpdStr = formatDateISO8601Time(dateUpd);

    let tooltip =
      `${i18n.__("Topic.TooltipCreated.date", {
        dateCreateStr,
      })} ` +
      (userCreate
        ? i18n.__("Topic.TooltipCreated.user", { userCreate })
        : "");
    if (dateUpd && dateUpdStr > dateCreateStr) {
      tooltip =
        `${tooltip}\n` +
        i18n.__("Topic.TooltipUpdated.date", { dateUpdStr }) +
        " " +
        (userUpd
          ? i18n.__("Topic.TooltipUpdated.user", { userUpd })
          : "");
    }
    return tooltip;
  },
);
