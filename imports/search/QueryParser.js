import { Meteor } from "meteor/meteor";

const TOKEN_TYPE_SEARCH = 1;
const TOKEN_TYPE_FILTER = 2;
const TOKEN_TYPE_LABEL = 3;

export class QueryParser {
  /**
   * @typedef {Object} FilterToken
   * @property {string} key The filter keyword
   * @property {string} value The filter value
   */

  /**
   * @typedef {Object} LabelToken
   * @property {string} token The search-word which was detected in the search query
   * @property {string[]} ids The matching label ids.
   */

  constructor(keywords, queryLabelIdsByName, queryUserIdsByName) {
    if (!keywords) {
      throw new Meteor.Error("invalid-state", "Please inject keywords object");
    }

    this.reset();
    this.queryLabelIdsByName = queryLabelIdsByName;
    this.queryUserIdsByName = queryUserIdsByName;
    this.keywords = keywords;
  }

  reset() {
    this.query = null;
    this.matchCase = false;
    /** @var {FilterToken[]} */
    this.filterTokens = [];
    /** @var {LabelToken[]} */
    this.labelTokens = [];
    /** @var {string[]} */
    this.searchTokens = [];
    this.isLabelToken = false;
    this.newLabel = false;
    this.currentLabel = null;
    this.queryParsed = false;
  }

  parse(query) {
    this.query = query;
    this.tokens = query.split(/\s/);
    this.tokens.forEach((token) => {
      this._parseToken(token);
    });
    // add last label
    if (this.currentLabel !== null) {
      this._addCompleteLabelToken();
    }
    this.queryParsed = true;
  }

  isCaseSensitive() {
    if (this.queryParsed) {
      return this.matchCase;
    } else {
      return this.query.indexOf("do:match-case") !== -1;
    }
  }

  hasKeyword(key, value) {
    let keywords = this.findKeywordsByKey(key, value);
    return keywords.length > 0;
  }

  findKeywordsByKey(key, value) {
    let keywords = [];
    key = typeof key === "string" ? key : key.key;
    for (let i = 0; i < this.filterTokens.length; i++) {
      let token = this.filterTokens[i];
      if (token.key === key && ((value && value === token.value) || !value)) {
        keywords.push(token);
      }
    }
    return keywords;
  }

  /**
   * Returns all filter tokens of the current
   * query. Filter tokens are special keywords
   * like is:action.
   *
   * @returns {FilterToken[]}
   */
  getFilterTokens() {
    return this.filterTokens;
  }

  /**
   * Returns all label tokens of the current
   * query. A label token contains the
   * search-word, and all matching label ids.
   *
   * @returns {LabelToken[]}
   */
  getLabelTokens() {
    return this.labelTokens;
  }

  /**
   * Returns all search tokens of the current
   * query.
   *
   * @returns {string[]}
   */
  getSearchTokens() {
    return this.searchTokens;
  }

  _parseToken(token) {
    let tokenType = this._getTokenType(token);
    switch (tokenType) {
      case TOKEN_TYPE_FILTER: {
        this._addFilterToken(token);
        break;
      }

      case TOKEN_TYPE_LABEL: {
        let result = this._addLabelToken(token);
        if (!result) {
          this.searchTokens.push(token);
        }
        break;
      }
      case TOKEN_TYPE_SEARCH: {
        this.searchTokens.push(token);
        break;
      }
      default:
        throw new Meteor.Error(
          "illegal-state",
          `Unknown token type ${tokenType}`,
        );
    }
  }

  _getTokenType(token) {
    if (this._isFilterKeyword(token)) {
      return TOKEN_TYPE_FILTER;
    }

    if (this._isLabelToken(token)) {
      return TOKEN_TYPE_LABEL;
    }

    return TOKEN_TYPE_SEARCH;
  }

  _isFilterKeyword(token) {
    let arr = token.split(":");
    let res = this.keywords.isKeyword(token);
    if (
      Object.prototype.hasOwnProperty.call(this.keywords, "DO") &&
      res &&
      arr[0] === this.keywords.DO.key &&
      arr[1] === "match-case"
    ) {
      this.matchCase = true;
    }
    return res;
  }

  _addFilterToken(token) {
    this.filterTokens.push(
      this.keywords.getKeyWordFromToken(token, this.queryUserIdsByName),
    );
  }

  /**
   *
   *
   * @param token
   * @private
   */
  _addLabelToken(token) {
    let completeLabel;
    if (this.newLabel) {
      if (this.currentLabel !== null) {
        this._addCompleteLabelToken();
      }
      this.currentLabel = token.substr(1);
    } else {
      completeLabel = this.currentLabel + ` ${token}`; // prepend whitespace!
      let matchingIds = this.queryLabelIdsByName
        ? this.queryLabelIdsByName(completeLabel, this.isCaseSensitive())
        : true;
      if (
        matchingIds === true ||
        (matchingIds !== null && matchingIds.length > 0)
      ) {
        this.currentLabel = completeLabel;
      } else {
        // the current token does not match any labels
        // this means the given token is a simple search token
        // so we add the previously concatenated label token-parts as
        // a new label token
        this.isLabelToken = false;
        this._addCompleteLabelToken();
        this.currentLabel = null;

        return false;
      }
    }
    return true;
  }

  _addCompleteLabelToken() {
    let token = this.currentLabel;
    let ids = this.queryLabelIdsByName
      ? this.queryLabelIdsByName(token, this.isCaseSensitive())
      : [token];
    this.labelTokens.push({
      token: token,
      ids: ids,
    });
  }

  _isLabelToken(token) {
    if (token.substr(0, 1) === "#") {
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
