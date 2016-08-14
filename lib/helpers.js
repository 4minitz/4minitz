global.formatDateISO8601 = function (aDate) {
    let isoString = "";
    aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); //removing the timezone offset.
    try {
        isoString = aDate.toISOString().substr(0,10);   // YYYY-MM-DD
    } catch (e) {
        isoString = "NaN-NaN-NaN";
    }
    return isoString;
};

global.formatDateISO8601Time = function (aDate) {
    let isoString = "";

    try {
        var tzoffset = aDate.getTimezoneOffset() * 60000; //offset in milliseconds
        isoString = (new Date(aDate - tzoffset)).toISOString().substr(0,19).replace("T"," ");   // YYYY-MM-DD hh:mm:ss
    } catch (e) {
        isoString = "NaN-NaN-NaN 00:00:00";
    }
    return isoString;
};


global.currentDatePlusDeltaDays = function(deltaDays, currentDate) {
    var aDate = (currentDate) ? currentDate : new Date();
    if (deltaDays) {
        aDate.setDate(aDate.getDate() + deltaDays);
    }
    return formatDateISO8601(aDate);
};

global.confirmationDialog = function(callback, dialogContent, dialogTitle = "Confirm delete", confirmButton = "Delete",
                                    confirmButtonType = "btn-danger", hideCancelButton = false) {
    let dialog = $('#confirmDialog');

    Session.set("confirmationDialogTitle", dialogTitle);
    Session.set("confirmationDialogContent", dialogContent);
    Session.set("confirmationDialogConfirmButton", confirmButton);
    Session.set("confirmationDialogConfirmButtonType", confirmButtonType);
    Session.set("confirmationDialogHideCancelButton", hideCancelButton);


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