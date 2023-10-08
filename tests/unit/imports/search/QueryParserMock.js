export class QueryParserMock {
  constructor() {
    this.init();
  }
  init() {
    this.caseSensitive = false;
    this.searchTokens = [];
    this.filterTokens = [];
    this.labelTokens = [];
  }
  reset() {
    // do nothing here, because this will be called before calling the parse
    // method
  }

  parse() {}
  getSearchTokens() {
    return this.searchTokens;
  }
  getFilterTokens() {
    return this.filterTokens;
  }
  getLabelTokens() {
    return this.labelTokens.map((token) => {
      return { token, ids: [token] };
    });
  }
  hasKeyword() {
    return true;
  }
  isCaseSensitive() {
    return this.caseSensitive;
  }
}
