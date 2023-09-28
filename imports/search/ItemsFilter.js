import { Meteor } from "meteor/meteor";
import { _ } from "meteor/underscore";

import { ITEM_KEYWORDS } from "./FilterKeywords";

export class ItemsFilter {
  constructor() {
    this.isCaseSensitive = false;
  }

  filter(docs, parser) {
    if (!parser) {
      throw new Meteor.Error("illegal-state", "Please inject a query parser.");
    }

    return this.filterWithParams(
      docs,
      parser.isCaseSensitive(),
      parser.getSearchTokens(),
      parser.getLabelTokens(),
      parser.getFilterTokens(),
    );
  }

  filterWithParams(
    docs,
    caseSensitive = false,
    searchTokens = [],
    labelTokens = [],
    filterTokens = [],
  ) {
    if (!docs) {
      docs = [];
    }

    this.isCaseSensitive = caseSensitive;
    return docs.filter((doc) => {
      return (
        this.docMatchesSearchTokens(doc, searchTokens) &&
        this.docMatchesLabelTokens(doc, labelTokens) &&
        this.docMatchesFilterTokens(doc, filterTokens)
      );
    });
  }

  _toUpper(str) {
    if (typeof str === "string")
      return this.isCaseSensitive ? str : str.toUpperCase();
    return str.toString();
  }

  docMatchesSearchTokens(doc, searchTokens) {
    for (let i = 0; i < searchTokens.length; i++) {
      let token = this._toUpper(searchTokens[i]);
      let subject = this._toUpper(doc.subject);
      let infos = doc.details
        ? this._toUpper(
            doc.details.reduce((acc, detail) => {
              return acc + detail.text;
            }, ""),
          )
        : "";
      let due = doc.duedate ? doc.duedate : "";
      if (
        subject.indexOf(token) === -1 &&
        infos.indexOf(token) === -1 &&
        doc.priority !== parseInt(token, 10) &&
        due.indexOf(token) === -1
      ) {
        return false;
      }
    }
    return true;
  }

  docMatchesLabelTokens(doc, labelTokens) {
    for (let i = 0; i < labelTokens.length; i++) {
      let labelToken = labelTokens[i];
      let labelIds = labelToken.ids;

      if (_.intersection(doc.labels, labelIds).length === 0) {
        return false;
      }
    }

    return true;
  }

  docMatchesFilterTokens(doc, filterTokens) {
    for (let i = 0; i < filterTokens.length; i++) {
      let filter = filterTokens[i];

      switch (filter.key) {
        case ITEM_KEYWORDS.IS.key: {
          if (!ItemsFilter._itemMatchesKeyword_IS(doc, filter.value)) {
            return false;
          }
          break;
        }
        case ITEM_KEYWORDS.USER.key: {
          if (!this._docMatchesKeywords_USER(doc, filter)) {
            return false;
          }
          break;
        }
        case ITEM_KEYWORDS.PRIO.key: {
          if (!(doc.priority && doc.priority === parseInt(filter.value, 10))) {
            return false;
          }
          break;
        }
        case ITEM_KEYWORDS.DUE.key: {
          if (!doc.duedate?.startsWith(filter.value)) {
            return false;
          }
          break;
        }
        case ITEM_KEYWORDS.DO.key: {
          break;
        }
        default:
          throw new Meteor.Error(
            "illegal-state",
            `Unknown filter keyword: ${filter.key}`,
          );
      }
    }

    return true;
  }

  _docMatchesKeywords_USER(doc, filter) {
    if (!doc.responsibles) {
      return false;
    }
    let respStr = doc.responsibles.reduce((acc, resp) => {
      return acc + resp;
    }, "");
    return (
      (filter.ids && _.intersection(doc.responsibles, filter.ids).length > 0) ||
      (filter.value &&
        this._toUpper(respStr).indexOf(this._toUpper(filter.value)) !== -1)
    );
  }

  static _itemMatchesKeyword_IS(item, value) {
    switch (value) {
      case "open":
        return item.isOpen;
      case "closed":
        // explicit comparison required to skip info items (which has no isOpen property)
        return item.isOpen === false;
      case "info":
        return item.itemType === "infoItem";
      case "action":
        return item.itemType === "actionItem";
      case "new":
        return item.isNew;
      case "sticky":
        return item.isSticky;
      default:
        throw new Meteor.Error(
          "illegal-state",
          `Unknown filter value: ${value}`,
        );
    }
  }
}
