import { Meteor } from "meteor/meteor";
import { _ } from "meteor/underscore";

const KEEP_ALIVE_INTERVAL_IN_MS = 30 * 1000;

const getVisibilityKeys = () => {
  const keys = {
    hidden: "visibilitychange",
    webkitHidden: "webkitvisibilitychange",
    mozHidden: "mozvisibilitychange",
    msHidden: "msvisibilitychange",
  };
  let stateKey, eventKey;

  for (stateKey in keys) {
    if (stateKey in document) {
      eventKey = keys[stateKey];
      break;
    }
  }
  return {
    stateKey,
    eventKey,
  };
};

const addVisiblityListener = (listener) => {
  document.addEventListener(getVisibilityKeys().eventKey, listener);
};

const removeVisiblityListener = (listener) => {
  document.removeEventListener(getVisibilityKeys().eventKey, listener);
};

const isVisible = () => {
  return !document[getVisibilityKeys().stateKey];
};

export class UserTracker {
  constructor(activeRoute) {
    this.activeRoute = activeRoute;
    this.onTabChangeOperation = () => {
      if (isVisible()) {
        this._setActiveRoute();
        this._startTimer();
      } else {
        this._clearActiveRoute();
        this._stopTimer();
      }
    };
  }

  _setActiveRoute() {
    Meteor.call("onlineUsers.enterRoute", this.activeRoute);
  }

  _clearActiveRoute() {
    Meteor.call("onlineUsers.leaveRoute", this.activeRoute);
  }

  onEnter() {
    this._setActiveRoute();
    this._startTimer();
    addVisiblityListener(this.onTabChangeOperation);
    this._addUnLoadListener();
  }

  _startTimer() {
    this.timerHandler = Meteor.setInterval(
      _.bind(this._setActiveRoute, this),
      KEEP_ALIVE_INTERVAL_IN_MS,
    );
  }

  _addUnLoadListener() {
    this.beforeUnloadListener = _.bind(this.onLeave, this);
    window.addEventListener("beforeunload", this.beforeUnloadListener);
  }

  onLeave() {
    this._clearActiveRoute();
    this._stopTimer();
    removeVisiblityListener(this.onTabChangeOperation);
    window.removeEventListener("beforeunload", this.beforeUnloadListener);
  }

  _stopTimer() {
    Meteor.clearInterval(this.timerHandler);
  }
}
