import { _ } from 'meteor/underscore';

const KEYWORDS = ['is'];
const KEYWORD_VALUES = ['open', 'closed', 'info', 'action', 'new'];

const TOKEN_TYPE_SEARCH = 1;
const TOKEN_TYPE_FILTER = 2;
const TOKEN_TYPE_LABEL = 3;

export class QueryParser {

    constructor() {
        this.reset();
    }

    reset() {
        this.query = null;
        this.filterTokens = [];
        this.labelTokens = [];
        this.searchTokens = [];
        this.isLabelToken = false;
        this.newLabel = false;
        this.currentLabel = null;
    }

    parse(query) {
        this.query = query;
        this.tokens = query.split(/\s/);
        this.tokens.forEach(token => { this._parseToken(token) });
        // add last label
        if (null !== this.currentLabel) {
            this.labelTokens.push(this.currentLabel);
        }
    }

    getFilterTokens() {
        return this.filterTokens;
    }

    getLabelTokens() {
        return this.labelTokens;
    }

    getSearchTokens() {
        return this.searchTokens;
    }

    _parseToken(token) {
        let tokenType = this._getTokenType(token);
        switch (tokenType) {
            case TOKEN_TYPE_FILTER:
            {
                this._addFilterToken(token);
                break;
            }

            case TOKEN_TYPE_LABEL:
            {
                this._addLabelToken(token);
                break;
            }
            case TOKEN_TYPE_SEARCH:
            {
                this.searchTokens.push(token);
                break;
            }
            default: throw new Meteor.Error('illegal-state', `Unknown token type ${tokenType}`)
        }
    }

    _getTokenType(token) {
        if (this.constructor._isFilterKeyword(token)) {
            return TOKEN_TYPE_FILTER;
        }

        if (this._isLabelToken(token)) {
            return TOKEN_TYPE_LABEL
        }

        return TOKEN_TYPE_SEARCH;
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

    _addLabelToken(token) {
        if (this.newLabel) {
            if (null !== this.currentLabel) {
                this.labelTokens.push(this.currentLabel);
            }
            this.currentLabel = token.substr(1);
        } else {
            this.currentLabel += ` ${token}`; // prepend whitespace!
        }
    }

    _isLabelToken(token) {
        if (token.substr(0, 1) === '#') {
            this.isLabelToken = true;
            this.newLabel = true;
            return true;
        } else if (this.isLabelToken) {
            this.newLabel = false;
            return true;
        } else {
            return false;
        }
    }
}