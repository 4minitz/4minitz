import {_} from 'meteor/underscore';

const noop = () => {};

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

    constructor(onEnterOperation, onLeaveOperation) {
        this.onEnterOperation = onEnterOperation || noop;
        this.onLeaveOperation = onLeaveOperation || noop;
        this.onTabChangeOperation = () => {
            if (isVisible()) this.onEnterOperation();
            else this.onLeaveOperation();
        }
    }

    onEnter() {
        this.onEnterOperation();

        addVisiblityListener(this.onTabChangeOperation);
        this._addUnLoadListener();
    }

    _addUnLoadListener() {
        this.beforeUnloadListener = _.bind(this.onLeave, this);
        window.addEventListener('beforeunload', this.beforeUnloadListener);
    }


    onLeave() {
        this.onLeaveOperation();
        removeVisiblityListener(this.onTabChangeOperation);
        window.removeEventListener('beforeunload', this.beforeUnloadListener);
    }

}