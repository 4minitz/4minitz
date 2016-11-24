import moment from 'moment/moment';

const MIN_DURATION_TIME = 1200;
let currentlyVisibleFlashMessage = null;
let countWaitingMessages = 0;

export class FlashMessage {
    constructor(title, message, type = 'alert-danger', duration = 5000) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.duration = duration;
        this.id = Random.id();
        this.start = null;
    }

    /**
     * Replaces the currently shown flash message
     * with a new one, immediately.
     *
     * @param title
     * @param message
     * @param type
     * @param duration
     */
    replace(title, message, type = 'alert-danger', duration = 5000) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.duration = duration;
        this.id = Random.id();
        countWaitingMessages++;
        this.showAndReplace();
    }

    /**
     * Displays the flash message. If there
     * are queued flash messages they will be shown
     * in a delay of |queue| * MIN_DURATION_TIME.
     *
     * @returns {FlashMessage}
     */
    show() {
        countWaitingMessages++;
        if (null == currentlyVisibleFlashMessage) {
            this.showAndReplace();
        } else {
            let duration = countWaitingMessages * MIN_DURATION_TIME;
            setTimeout(() => {
                this.showAndReplace();
            }, duration);
        }
        return this;
    }

    /**
     * Shows the flash message immediately
     * disregarded if any message is currently
     * displayed.
     */
    showAndReplace() {
        countWaitingMessages--;
        this.start = moment();
        currentlyVisibleFlashMessage = this.id;
        Session.set('errorId', this.id);
        Session.set('errorTitle', this.title);
        Session.set('errorReason', this.message);
        Session.set('errorType', this.type);
        Session.set('errorDuration', this.duration);
    }

    /**
     * Hides the current FlashMessage object. If
     * the duration time is less than the MIN_DURATION_TIME
     * the message will be displayed until the MIN_DURATION_TIME
     * is reached.
     */
    hideMe() {
        if (null === this.start) { return; }
        let now = moment();
        let displayingTime = now.diff(this.start);
        if (displayingTime > MIN_DURATION_TIME) {
            this.constructor.hide();
        } else {
            let delay = MIN_DURATION_TIME - displayingTime;
            setTimeout(() => {
                this.constructor.hide();
            }, delay);
        }
    }

    /**
     * Hides the currently shown flash message
     * immediately.
     */
    static hide() {
        currentlyVisibleFlashMessage = null;
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
            let closeId = Session.get('errorId');
            setTimeout(() => {
                if (closeId === null || closeId === currentlyVisibleFlashMessage) {
                    FlashMessage.hide();
                }
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
