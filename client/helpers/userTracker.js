import {_} from 'meteor/underscore';

const noop = () => {};

export class UserTracker {

    constructor(onEnterOperation, onLeaveOperation) {
        this.onEnterOperation = onEnterOperation || noop;
        this.onLeaveOperation = onLeaveOperation || noop;
    }

    onEnter() {
        this.onEnterOperation();
        this.beforeUnloadListener = _.bind(this.onLeave, this);
        window.addEventListener('beforeunload', this.beforeUnloadListener);
    }

    onLeave() {
        this.onLeaveOperation();
        window.removeEventListener('beforeunload', this.beforeUnloadListener);
    }

}