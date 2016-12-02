

export class TopicFilter {

    constructor(queryParser) {
        if (null === queryParser || undefined === queryParser) {
            throw new Meteor.Error('illegal-state', 'Please inject a query parser.');
        }
        this.currentTopics = null;
        this.parser = queryParser;
    }

    filter(topics, query) {
        this.currentTopics = topics;
        this.parser.parse(query);

        this.currentTopics = this._filterForSearchTokens(this.parser.getSearchTokens());
        let result = this.currentTopics;
        this.currentTopics = null;
        this.parser.reset();
        return result;
    }

    /**
     *
     * @param searchTokens string[]|string
     * @returns {*}
     * @private
     */
    _filterForSearchTokens(searchTokens) {
        if (null === this.currentTopics) {
            throw new Meteor.Error('illegal-state', 'Current state invalid. Query or topics-array null.');
        }
        if (typeof searchTokens === 'string') {
            searchTokens = [searchTokens];
        }

        let infoItemFilter = item => {
            for (let i=0; i < searchTokens.length; i++) {
                let token = searchTokens[i];
                if (item.subject.indexOf(token) === -1) {
                    return false;
                }
            }
            return true;
            //return item.subject.indexOf(query) !== -1;
        };

        return this.currentTopics
            .filter(topic => topic.infoItems.some(infoItemFilter))
            .map(topic => {
                let newTopic = Object.assign({}, topic);
                newTopic.infoItems = topic.infoItems.filter(infoItemFilter);
                return newTopic;
            });
    }

}