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
    return yyyy+"-"+mm+"-"+dd;
};


currentDatePlusDeltaDays = function(deltaDays) {
    var aDate = new Date();
    if (deltaDays) {
        aDate.setDate(aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};

confirmationDialog = function(callback, dialogContent, dialogTitle = "Confirm delete", confirmButton = "Delete") {
    let dialog = $('#confirmDialog');

    Session.set("confirmationDialogTitle", dialogTitle);
    Session.set("confirmationDialogContent", dialogContent);
    Session.set("confirmationDialogConfirmButton", confirmButton);


    // workaround: unbind() to make sure it will be called only once!
    let okBtn = dialog.find('#confirmationDialogOK');
    okBtn.unbind().click(callback);
    // set the label of the confirmation button manually because unbind() disables the meteor refresh feature ...
    okBtn.html(confirmButton);

    dialog.modal('show');
};