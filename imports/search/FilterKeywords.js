import { _ } from 'meteor/underscore';

export const KEYWORDS = {
    IS: {
        key: 'is',
        values: ['open', 'closed', 'info', 'action', 'new']
    },
    DO: {
        key: 'do',
        values: ['match-case']
    },

    isAllowedValueForKey: function(key, value) {
        key = key.toUpperCase();
        return ( this.hasOwnProperty(key) && _.contains(this[key].values, value) )
    }
};