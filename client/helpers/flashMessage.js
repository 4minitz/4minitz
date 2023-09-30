import { $ } from "meteor/jquery";

const DEFAULT_MESSAGE = "Sorry, an unexpected error has occurred.";

const TYPES = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  DANGER: "danger",
};

export class FlashMessage {
  /**
   *
   * @return {{SUCCESS: string, INFO: string, WARNING: string, DANGER: string}}
   */
  static TYPES() {
    return TYPES;
  }

  constructor(title, message, type = TYPES.DANGER, duration = 5000) {
    this._setValues(title, message, type, duration);
    this.currentNotification = null;
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
  replace(title, message, type = TYPES.DANGER, duration = 5000) {
    this._setValues(title, message, type, duration);
    this._updateNotification();
  }

  _updateNotification() {
    this.currentNotification.update("title", this.title);
    this.currentNotification.update("message", this.message);
    this.currentNotification.update("type", this.type);
    this.currentNotification.update("delay", this.duration);
  }

  _setValues(title, message, type = TYPES.DANGER, duration = 5000) {
    if (duration === -1) duration = 0;
    this.title = `<strong>${title}</strong>`;
    this.message = message || DEFAULT_MESSAGE;
    this.type = type.replace("alert-", "");
    this.duration = duration;
  }

  /**
   * Displays the flash message. If there
   * are queued flash messages they will be shown
   * in a delay of |queue| * MIN_DURATION_TIME.
   *
   * @returns {FlashMessage}
   */
  show() {
    this.currentNotification = $.notify(
      this._createOptions(),
      this._createSettings(),
    );
    return this;
  }

  _createOptions() {
    return {
      title: this.title,
      message: this.message,
    };
  }

  _createSettings() {
    return {
      delay: this.duration,
      type: this.type,
      z_index: 5031,
      onClosed: () => {
        this.currentNotification = null;
      },
    };
  }

  /**
   * Hides the current FlashMessage object immediately.
   */
  hideMe() {
    if (this.currentNotification === null) return;
    this.currentNotification.close();
  }
}
