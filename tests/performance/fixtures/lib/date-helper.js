

export class DateHelper {

    static formatDateISO8601(aDate) {
        let isoString = "";
        aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); //removing the timezone offset.
        try {
            isoString = aDate.toISOString().substr(0,10);   // YYYY-MM-DD
        } catch (e) {
            isoString = "NaN-NaN-NaN";
        }
        return isoString;
    }

    static formatDateISO8601Time(aDate, timeZoneCorrection = true) {
        let isoString = "";

        try {
            let tzoffset = timeZoneCorrection ? aDate.getTimezoneOffset() * 60000  :  0; //offset in milliseconds
            isoString = (new Date(aDate - tzoffset)).toISOString().substr(0,19).replace("T"," ");   // YYYY-MM-DD hh:mm:ss
        } catch (e) {
            isoString = "NaN-NaN-NaN 00:00:00";
        }
        return isoString;
    };

}