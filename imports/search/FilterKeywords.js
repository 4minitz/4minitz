import { _ } from 'meteor/underscore';

let isKeyword = function(token) {
    if (this.USER && token.startsWith(this.USER.key)) {
        return true;
    }
    let arr = token.split(':');
    return ( arr.length == 2 && this.isAllowedValueForKey(arr[0], arr[1]) );
};

let getKeyWordFromToken = function(token, queryUserIdByName) {
    let key, value, ids;
    ids = [];
    if (this.USER && token.startsWith(this.USER.key)) {
        key = this.USER.key;
        value = token.substr(1);
        if (queryUserIdByName) {
            ids = queryUserIdByName(value);
            if (value === 'me') {
                value = "";
            }
        }
    } else {
        let arr = token.split(':');
        key = arr[0];
        value = arr[1];
    }
    return {
        key: key,
        value: value,
        ids: ids
    };
};

let isAllowedValueForKey = function(key, value) {
    key = key.toUpperCase();
    if (this.hasOwnProperty(key)) {
        let values = this[key].values;
        return (values === '*' || _.contains(values, value));
    }
    return false;
};

export const ITEM_KEYWORDS = {
    IS: {
        key: 'is',
        values: ['open', 'closed', 'info', 'action', 'new', 'sticky']
    },
    DO: {
        key: 'do',
        values: ['match-case']
    },
    PRIO: {
        key: 'prio',
        values: '*'
    },
    DUE: {
        key: 'due',
        values: '*'
    },
    USER: {
        key: '@',
        values: '*',
        format: '@username'
    },

    isKeyword: isKeyword,

    getKeyWordFromToken: getKeyWordFromToken,

    isAllowedValueForKey: isAllowedValueForKey
};

export const TOPIC_KEYWORDS = {
    IS: {
        key: 'is',
        values: ['open', 'closed', 'new']
    },
    HAS: {
        key: 'has',
        values: ['item', 'action', 'info']
    },
    DO: {
        key: 'do',
        values: ['match-case']
    },
    USER: {
        key: '@',
        values: '*',
        format: '@username'
    },

    isKeyword: isKeyword,

    getKeyWordFromToken: getKeyWordFromToken,

    isAllowedValueForKey: isAllowedValueForKey
};