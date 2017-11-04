const assert = require('assert');

const PRIORITY_MAP = {
    1: '1 - High',
    2: '2',
    3: '3 - Medium',
    4: '4',
    5: '5 - Low'
};

export class Priority {

    static GET_DEFAULT_PRIORITY() {
        return new Priority(3);
    }

    static GET_PRIORITIES() {
        return Object.keys(PRIORITY_MAP).map(value => new Priority(value));
    }

    static extractPriorityFromString(string) {
        const regEx = /prio:([1-5])/g;
        let match = regEx.exec(string);
        if (match !== null) {
            return new Priority(match[1]);
        }
        return false;
    }

    constructor(value) {
        assert(value >= 1 && value < 6, `invalid priority value: ${value}`);
        this.value = parseInt(value,10);
    }

    toString() {
        if (PRIORITY_MAP.hasOwnProperty(this.value)) {
            return PRIORITY_MAP[this.value];
        }
        throw new Error(`illegal-state: Unknown priority ${this.value}`);
    }

}