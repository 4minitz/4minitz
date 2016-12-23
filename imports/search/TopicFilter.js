import { _ } from 'meteor/underscore';

import { KEYWORDS } from './FilterKeywords';

export class TopicFilter {

    constructor(queryParser) {
        if (null === queryParser || undefined === queryParser) {
            throw new Meteor.Error('illegal-state', 'Please inject a query parser.');
        }
        this.currentTopics = null;
        this.parser = queryParser;
    }

    filter(topics, query) {
        this.parser.reset();
        this.currentTopics = topics;
        this.parser.parse(query);

        this.currentTopics = this._filterTopics();
        return this.currentTopics
    }

    isItemView() {
        return this.parser.hasKeyword(KEYWORDS.IS, 'item');
    }

    _filterTopics() {
        this._checkFilterState();

        let infoItemFilter = item => {
            return this._itemMatchesSearchTokens(item, this.parser.getSearchTokens())
                && this.constructor._itemMatchesLabelTokens(item, this.parser.getLabelTokens())
                && this.constructor._itemMatchesFilterTokens(item, this.parser.getFilterTokens());
        };

        if (this.isItemView()) {
            this.currentTopics = this.currentTopics.filter(topic => topic.infoItems.some(infoItemFilter));
        }

        return this.currentTopics
            .map(topic => {
                let newTopic = Object.assign({}, topic);
                newTopic.infoItems = topic.infoItems.filter(infoItemFilter);
                return newTopic;
            });
    }

    _checkFilterState() {
        if (null === this.currentTopics) {
            throw new Meteor.Error('illegal-state', 'Current state invalid. Query or topics-array null.');
        }
    }

    _toUpper(str) {
        return (this.parser.isCaseSensitive()) ? str : str.toUpperCase();
    }

    _itemMatchesSearchTokens(item, searchTokens) {
        for (let i=0; i < searchTokens.length; i++) {
            let token = this._toUpper(searchTokens[i]);
            let subject = this._toUpper(item.subject);
            let infos = (item.details)
                ? this._toUpper(item.details.reduce((acc, detail) => { return acc + detail.text; }, ""))
                : "";
            let prio = (item.priority) ? this._toUpper(item.priority) : '';
            let due = (item.duedate) ? item.duedate : '';
            if (
                (subject.indexOf(token) === -1
                && infos.indexOf(token) === -1
                && prio.indexOf(token) === -1
                && due.indexOf(token) === -1)
            ) {
                return false;
            }
        }
        return true;
    }

    static _itemMatchesFilterTokens(item, filterTokens) {
        for (let i=0; i < filterTokens.length; i++) {
            let filter = filterTokens[i];

            switch (filter.key) {
                case KEYWORDS.IS.key:
                {
                    if (!TopicFilter._itemMatchesKeyword_IS(item, filter.value)) {
                        return false;
                    }
                    break;
                }
                case KEYWORDS.USER.key:
                {
                    if (!( item.responsibles && _.contains(item.responsibles, filter.value) )) {
                        return false;
                    }
                    break;
                }
                case KEYWORDS.PRIO.key:
                {
                    if (!( item.priority && item.priority.startsWith(filter.value))) {
                        return false;
                    }
                    break;
                }
                case KEYWORDS.DUE.key:
                {
                    if (!( item.duedate && item.duedate.startsWith(filter.value))) {
                        return false;
                    }
                    break;
                }
                case KEYWORDS.DO.key:
                {
                    break;
                }
                default: throw new Meteor.Error('illegal-state', `Unknown filter keyword: ${filter.key}`);
            }
        }

        return true;
    }

    static _itemMatchesKeyword_IS(item, value) {
        switch (value) {
            case 'item':
                return true;
            case 'open':
                return item.isOpen;
            case 'closed':
                // explicit comparison required to skip info items (which has no isOpen property)
                return item.isOpen === false;
            case 'info':
                return item.itemType === 'infoItem';
            case 'action':
                return item.itemType === 'actionItem';
            case 'new':
                return item.isNew;
            case 'sticky':
                return item.isSticky;
            default: throw new Meteor.Error('illegal-state', `Unknown filter value: ${filter.value}`);
        }
    }

    static _itemMatchesLabelTokens(item, labelTokens) {
        for (let i=0; i < labelTokens.length; i++) {
            let labelToken = labelTokens[i];
            let labelIds = labelToken.ids;

            if (_.intersection(item.labels, labelIds).length === 0 ) {
                return false;
            }
        }

        return true;
    }
}