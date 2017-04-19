export const emailAddressRegExpTest = /^[^\s@]+@([^\s@]+){2,}\.([^\s@]+){2,}$/;
export const emailAddressRegExpMatch = /([a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z0-9._-]{2,})/gi;

/**
 *
 * @param {Date} aDate
 * @param {boolean} [timeZoneCorrection=true] perform shift of aDate according to time zone?
 * @returns {string} YYYY-MM-DD hh:mm:ss
 */
export const formatDateISO8601Time = (aDate, timeZoneCorrection = true) => {
    let isoString = "";

    try {
        let tzoffset = timeZoneCorrection ? aDate.getTimezoneOffset() * 60000  :  0; //offset in milliseconds
        isoString = (new Date(aDate - tzoffset)).toISOString().substr(0,19).replace("T"," ");   // YYYY-MM-DD hh:mm:ss
    } catch (e) {
        isoString = "NaN-NaN-NaN 00:00:00";
    }
    return isoString;
};

// removes leading "00:" if there are no hours
export const msToHHMMSS = ms => {
    let date = new Date (ms);
    let timeString =  formatDateISO8601Time(date, false).slice(-8);
    timeString = timeString.replace(/^00:/, "");
    return timeString;
};

export const formatDateISO8601 = aDate => {
    let isoString = "";
    aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); //removing the timezone offset.
    try {
        isoString = aDate.toISOString().substr(0,10);   // YYYY-MM-DD
    } catch (e) {
        isoString = "NaN-NaN-NaN";
    }
    return isoString;
};

export const currentDatePlusDeltaDays = (deltaDays, currentDate) => {
    var aDate = (currentDate) ? currentDate : new Date();
    if (deltaDays) {
        aDate.setDate(aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};
// todo: replace all global calls with imports, then remove this
global.currentDatePlusDeltaDays = currentDatePlusDeltaDays;

export const subElementsHelper = {
    findIndexById: function(id, elements, attributeName) {
        if (!attributeName) {
            attributeName = '_id';
        }
        let i;
        for (i = 0; i < elements.length; i++) {
            if (id === elements[i][attributeName]) {
                return i;
            }
        }
        return undefined;
    },

    getElementById: function(id, elements, attributeName) {
        let i = subElementsHelper.findIndexById(id, elements, attributeName);
        if (i != undefined) {
            return elements[i];
        }
        return undefined;
    }
};
// todo: replace all global calls with imports, then remove this
global.subElementsHelper = subElementsHelper;

export const checkWithMsg = (variable, pattern, message) => {
    try {
        check(variable, pattern);
    } catch (err) {
        if (message) {
            throw new Meteor.Error("Parameter check failed.", message);
        }
        throw err;
    }
};
// todo: replace all global calls with imports, then remove this
global.checkWithMsg = checkWithMsg;
