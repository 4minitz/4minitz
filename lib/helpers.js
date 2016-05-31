global.formatDateISO8601 = function (aDate) {
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


global.currentDatePlusDeltaDays = function(deltaDays, currentDate) {
    var aDate = (currentDate) ? currentDate : new Date();
    if (deltaDays) {
        aDate.setDate(aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};

global.confirmationDialog = function(callback, dialogContent, dialogTitle = "Confirm delete", confirmButton = "Delete",
                                    confirmButtonType = "btn-danger") {
    let dialog = $('#confirmDialog');

    Session.set("confirmationDialogTitle", dialogTitle);
    Session.set("confirmationDialogContent", dialogContent);
    Session.set("confirmationDialogConfirmButton", confirmButton);
    Session.set("confirmationDialogConfirmButtonType", confirmButtonType);


    // workaround: unbind() to make sure it will be called only once!
    let okBtn = dialog.find('#confirmationDialogOK');
    okBtn.unbind().click(callback);
    // set the label of the confirmation button manually because unbind() disables the meteor refresh feature ...
    okBtn.html(confirmButton);
    okBtn.removeClass();
    okBtn.addClass("btn");
    okBtn.addClass("btn-ok");
    okBtn.addClass("btn-raised");
    okBtn.addClass(confirmButtonType);

    dialog.modal('show');
};

global.subElementsHelper = {
    findIndexById: function(id, elements) {
        let i;
        for (i = 0; i < elements.length; i++) {
            if (id === elements[i]._id) {
                return i;
            }
        }
        return undefined;
    }
};