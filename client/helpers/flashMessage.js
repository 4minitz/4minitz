Template.registerHelper('errorTitle', () => {
    let title = Session.get("errorTitle");

    if (title) {
        setTimeout(() => {
            Session.set("errorTitle", false);
            Session.set("errorType", "alert-danger");
        }, 5000);
    }

    return title;
});

Template.registerHelper('errorMessage', () => {
    return Session.get("errorReason");
});

Template.registerHelper('errorType', () => {
    let type = Session.get("errorType");
    if (!type) type = 'alert-danger';
    return type;
});
