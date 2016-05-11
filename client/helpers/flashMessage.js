Template.registerHelper('errorTitle', () => {
    let title = Session.get("errorTitle");

    if (title) {
        setTimeout(() => {
            Session.set("errorTitle", false);
        }, 5000);
    }

    return title;
});

Template.registerHelper('errorMessage', () => {
    return Session.get("errorReason");
});
