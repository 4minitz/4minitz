

export class TopicFilter {

    constructor() {
        this.currentQuery = null;
        this.currentTopics = null;
    }

    filter(topics, query) {
        this.currentTopics = topics;
        this.currentQuery = query;
        let result;


        result = this._filterSubject();
        this.currentQuery = null;
        this.currentTopics = null;
        return result;
    }

    _filterSubject() {
        if (null === this.currentQuery || null === this.currentTopics) {
            throw new Meteor.Error('illegal-state', 'Current state invalid. Query or topics-array null.');
        }

        let infoItemFilter = item => item.subject.indexOf(this.currentQuery) !== -1;

        return this.currentTopics
            .filter(topic => topic.infoItems.some(infoItemFilter))
            .map(topic => {
                let newTopic = Object.assign({}, topic);
                newTopic.infoItems = topic.infoItems.filter(infoItemFilter);
                return newTopic;
            });
    }

}