import { _ } from 'meteor/underscore';

import { ItemsFilter } from './ItemsFilter'

export class TopicDocFilter {

    constructor() {
        this.isCaseSensitive = false;
        this.itemsFilter = new ItemsFilter();
    }

    filter(docs, parser) {
        if (!parser) { throw new Meteor.Error('illegal-state', 'Please inject a query parser.'); }
        if (!docs) { docs = []; }


        this.isCaseSensitive = parser.isCaseSensitive();
        return docs.filter(doc => {
            return this.docMatchesSearchTokens(doc, parser.getSearchTokens())
                && this.docMatchesLabelTokens(doc, parser.getLabelTokens())
                && this.docMatchesFilterTokens(doc, parser.getFilterTokens());
        });
    }

    docMatchesSearchTokens(doc, searchTokens) {
        for (let i=0; i < searchTokens.length; i++) {
            let token = this._toUpper(searchTokens[i]);
            let subject = this._toUpper(doc.subject);

            let hasMatchingInfoItems =
                this.itemsFilter.filterWithParams(doc.infoItems, this.isCaseSensitive, [token]).length > 0;

            if (
                (subject.indexOf(token) === -1
                && !hasMatchingInfoItems)
            ) {
                return false;
            }
        }
        return true;
    }

    _toUpper(str) {
        return (this.isCaseSensitive) ? str : str.toUpperCase();
    }


    docMatchesLabelTokens(doc, labelTokens) {
        for (let i=0; i < labelTokens.length; i++) {
            let token = labelTokens[i];
            let hasMatchingInfoItems =
                this.itemsFilter.filterWithParams(doc.infoItems, this.isCaseSensitive, [], [token]).length > 0;
            if (!hasMatchingInfoItems) {
                return false;
            }
        }
        return true;
    }

    docMatchesFilterTokens(doc, filterTokens) {
        return true;
    }


}