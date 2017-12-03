/**
 *
 * @param {Date} aDate
 * @param {boolean} [timeZoneCorrection=true] perform shift of aDate according to time zone?
 * @returns {string} YYYY-MM-DD hh:mm:ss
 */
export const formatDateISO8601Time = (aDate, timeZoneCorrection = true) => {
    let isoString = '';

    try {
        let tzoffset = timeZoneCorrection ? aDate.getTimezoneOffset() * 60000  :  0; //offset in milliseconds
        isoString = (new Date(aDate - tzoffset)).toISOString().substr(0,19).replace('T',' ');   // YYYY-MM-DD hh:mm:ss
    } catch (e) {
        isoString = 'NaN-NaN-NaN 00:00:00';
    }
    return isoString;
};

// removes leading "00:" if there are no hours
export const msToHHMMSS = ms => {
    let date = new Date (ms);
    let timeString =  formatDateISO8601Time(date, false).slice(-8);
    timeString = timeString.replace(/^00:/, '');
    return timeString;
};

export const formatDateISO8601 = aDate => {
    let isoString = '';
    aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); //removing the timezone offset.
    try {
        isoString = aDate.toISOString().substr(0,10);   // YYYY-MM-DD
    } catch (e) {
        isoString = 'NaN-NaN-NaN';
    }
    return isoString;
};

export const currentDatePlusDeltaDays = (deltaDays, currentDate) => {
    let aDate = (currentDate) ? currentDate : new Date();
    if (deltaDays) {
        aDate = new Date(aDate.getFullYear(), aDate.getMonth(), aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};

export const extractDateFromString = (string) => {
    const regEx = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/g;
    let match = regEx.exec(string);
    return (match !== null) ? match[0] : false;
};
