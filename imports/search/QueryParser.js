import { _ } from 'meteor/underscore';

const KEYWORDS = ['is'];
const KEYWORD_VALUES = ['open', 'closed', 'info', 'action'];

export class QueryParser {

    constructor() {
        this.query = null;
        this.filterTokens = [];
        this.searchTokens = [];
    }

    parse(query) {
        this.query = query;
        this.tokens = query.split(/\s/);
        this.tokens.forEach(token => { this._parseToken(token) });
    }

    getSearchTokens() {
        return this.searchTokens;
    }

    getFilterTokens() {
        return this.filterTokens;
    }

    _parseToken(token) {
        if (this.constructor._isFilterKeyword(token)) {
            this._addFilterToken(token);
        } else {
            this.searchTokens.push(token);
        }
    }

    static _isFilterKeyword(token) {
        let arr = token.split(':');
        return ( arr.length == 2 && _.contains(KEYWORDS, arr[0]) && _.contains(KEYWORD_VALUES, arr[1]) );
    }

    _addFilterToken(token) {
        let arr = token.split(':');
        this.filterTokens.push({
            key: arr[0],
            value: arr[1]
        })
    }


}