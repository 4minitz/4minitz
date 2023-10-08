import { Meteor } from "meteor/meteor";
import { _ } from "meteor/underscore";

import { TOPIC_KEYWORDS } from "./FilterKeywords";
import { ItemsFilter } from "./ItemsFilter";

export class TopicsFilter {
  constructor() {
    this.isCaseSensitive = false;
    this.itemsFilter = new ItemsFilter();
  }

  filter(docs, parser) {
    if (!parser) {
      throw new Meteor.Error("illegal-state", "Please inject a query parser.");
    }
    if (!docs) {
      docs = [];
    }

    this.isCaseSensitive = parser.isCaseSensitive();
    return docs.filter((doc) => {
      return (
        this.docMatchesSearchTokens(doc, parser.getSearchTokens()) &&
        this.docMatchesLabelTokens(doc, parser.getLabelTokens()) &&
        this.docMatchesFilterTokens(doc, parser.getFilterTokens())
      );
    });
  }

  docMatchesSearchTokens(doc, searchTokens) {
    for (let i = 0; i < searchTokens.length; i++) {
      const token = this._toUpper(searchTokens[i]);
      const subject = this._toUpper(doc.subject);

      const hasMatchingInfoItems =
        this.itemsFilter.filterWithParams(doc.infoItems, this.isCaseSensitive, [
          token,
        ]).length > 0;

      if (subject.indexOf(token) === -1 && !hasMatchingInfoItems) {
        return false;
      }
    }
    return true;
  }

  _toUpper(str) {
    return this.isCaseSensitive ? str : str.toUpperCase();
  }

  docMatchesLabelTokens(doc, labelTokens) {
    for (let i = 0; i < labelTokens.length; i++) {
      const token = labelTokens[i];
      const hasMatchingInfoItems =
        this.itemsFilter.filterWithParams(
          doc.infoItems,
          this.isCaseSensitive,
          [],
          [token],
        ).length > 0;
      if (!hasMatchingInfoItems) {
        return false;
      }
    }
    return true;
  }

  docMatchesFilterTokens(doc, filterTokens) {
    for (let i = 0; i < filterTokens.length; i++) {
      const filter = filterTokens[i];

      switch (filter.key) {
        case TOPIC_KEYWORDS.IS.key: {
          if (!this.constructor._docMatchesKeyword_IS(doc, filter.value)) {
            return false;
          }
          break;
        }
        case TOPIC_KEYWORDS.HAS.key: {
          if (!this._docMatchesKeyword_HAS(doc, filter.value)) {
            return false;
          }
          break;
        }
        case TOPIC_KEYWORDS.USER.key: {
          if (!this._docMatchesKeywords_USER(doc, filter)) {
            return false;
          }
          break;
        }
        case TOPIC_KEYWORDS.DO.key: {
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
    const respStr = doc.responsibles.reduce((acc, resp) => {
      return acc + resp;
    }, "");
    return (
      (filter.ids && _.intersection(doc.responsibles, filter.ids).length > 0) ||
      (filter.value &&
        this._toUpper(respStr).indexOf(this._toUpper(filter.value)) !== -1)
    );
  }

  static _docMatchesKeyword_IS(doc, value) {
    switch (value) {
      case "uncompleted":
      case "open":
        return doc.isOpen;
      case "completed":
      case "closed":
        return !doc.isOpen;
      case "new":
        return doc.isNew;
      default:
        throw new Meteor.Error(
          "illegal-state",
          `Unknown filter value: ${value}`,
        );
    }
  }

  _docMatchesKeyword_HAS(doc, value) {
    switch (value) {
      case "item":
        return doc.infoItems.length > 0;
      case "info":
      case "action": {
        const items = this.itemsFilter.filterWithParams(
          doc.infoItems,
          this.isCaseSensitive,
          [],
          [],
          [{ key: "is", value }],
        );
        return items.length > 0;
      }
      default:
        throw new Meteor.Error(
          "illegal-state",
          `Unknown filter value: ${value}`,
        );
    }
  }
}
