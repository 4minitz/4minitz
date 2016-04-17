formatDateISO8601 = function (aDate) {
    var dd = aDate.getDate();
    var mm = aDate.getMonth()+1; //January is 0!
    var yyyy = aDate.getFullYear();
    if(dd<10){
        dd='0'+dd
    }
    if(mm<10){
        mm='0'+mm
    }
    var todayString = yyyy+"-"+mm+"-"+dd;
    return todayString
};


currentDatePlusDeltaDays = function(deltaDays) {
    var aDate = new Date();
    if (deltaDays) {
        aDate.setDate(aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};
