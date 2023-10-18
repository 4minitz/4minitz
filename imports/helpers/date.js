/**
 *
 * @param {Date} aDate
 * @param {boolean} [timeZoneCorrection=true] perform shift of aDate according
 *     to time zone?
 * @returns {string} YYYY-MM-DD hh:mm:ss
 */
export const formatDateISO8601Time = (aDate, timeZoneCorrection = true) => {
  try {
    const tzoffset = timeZoneCorrection
      ? aDate.getTimezoneOffset() * 60_000
      : 0; // offset in milliseconds
    return new Date(aDate - tzoffset)
      .toISOString()
      .substr(0, 19)
      .replace("T", " "); // YYYY-MM-DD hh:mm:ss
  } catch (e) {
    return "NaN-NaN-NaN 00:00:00";
  }
};

// removes leading "00:" if there are no hours
export const msToHHMMSS = (ms) => {
  const date = new Date(ms);
  const timeString = formatDateISO8601Time(date, false).slice(-8);
  return timeString.replace(/^00:/, "");
};

export const formatDateISO8601 = (aDate) => {
  aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); // removing the timezone offset.
  try {
    return aDate.toISOString().substr(0, 10); // YYYY-MM-DD
  } catch (e) {
    return "NaN-NaN-NaN";
  }
};

export const currentDatePlusDeltaDays = (deltaDays, currentDate) => {
  const aDate = currentDate ? currentDate : new Date();
  if (deltaDays) {
    aDate.setDate(aDate.getDate() + deltaDays);
  }
  return formatDateISO8601(aDate);
};

export const extractDateFromString = (string) => {
  const regEx = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/g;
  const match = regEx.exec(string);
  return match !== null ? match[0] : false;
};
