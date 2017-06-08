import { Meteor } from 'meteor/meteor';
import {_} from 'meteor/underscore';

const getVisibilityKeys = () => {
    const keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    let stateKey, eventKey;

    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return {
        stateKey: stateKey,
        eventKey: eventKey
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
            if (isVisible()) this._setActiveRoute();
            else this._clearActiveRoute();
        }
    }

    _setActiveRoute() {
        Meteor.call('onlineUsers.enterRoute', this.activeRoute);
    }

    _clearActiveRoute() {
        Meteor.call('onlineUsers.leaveRoute', this.activeRoute);
    }

    onEnter() {
        this._setActiveRoute();

        addVisiblityListener(this.onTabChangeOperation);
        this._addUnLoadListener();
    }

    _addUnLoadListener() {
        this.beforeUnloadListener = _.bind(this.onLeave, this);
        window.addEventListener('beforeunload', this.beforeUnloadListener);
    }


    onLeave() {
        this._clearActiveRoute();
        removeVisiblityListener(this.onTabChangeOperation);
        window.removeEventListener('beforeunload', this.beforeUnloadListener);
    }

}