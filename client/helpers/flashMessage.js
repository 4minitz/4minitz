
export class FlashMessage {
    constructor(title, message, type = 'alert-danger', duration = 5000) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.duration = duration;
    }

    show() {
        Session.set('errorTitle', this.title);
        Session.set('errorReason', this.message);
        Session.set('errorType', this.type);
        Session.set('errorDuration', this.duration);
    }

    static hide() {
        Session.set('errorTitle', false);
        Session.set('errorType', 'alert-danger');
        Session.set('errorDuration', 5000);
    }
}

Template.registerHelper('errorTitle', () => {
    let title = Session.get("errorTitle");

    if (title) {
        let duration = Session.get('errorDuration');
        if (!duration) {
            duration = 5000;
        }
        if (duration !== -1) {
            setTimeout(() => {
                FlashMessage.hide();
            }, duration);
        }
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
