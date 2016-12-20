import { _ } from 'meteor/underscore';

export const KEYWORDS = {
    IS: {
        key: 'is',
        values: ['open', 'closed', 'info', 'action', 'new', 'sticky', 'item']
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

    isKeyword: function(token) {
        if (token.startsWith(this.USER.key)) {
            return true;
        }
        let arr = token.split(':');
        return ( arr.length == 2 && KEYWORDS.isAllowedValueForKey(arr[0], arr[1]) );
    },

    getKeyWordFromToken: function(token, queryUserIdByName) {
        let key, value;
        if (token.startsWith(this.USER.key)) {
            key = this.USER.key;
            value = token.substr(1);
            if (queryUserIdByName) {
                value = queryUserIdByName(value);
            }
        } else {
            let arr = token.split(':');
            key = arr[0];
            value = arr[1];
        }
        return {
            key: key,
            value: value
        };
    },

    isAllowedValueForKey: function(key, value) {
        key = key.toUpperCase();
        if (this.hasOwnProperty(key)) {
            let values = this[key].values;
            return (values === '*' || _.contains(values, value));
        }
        return false;



    }
};