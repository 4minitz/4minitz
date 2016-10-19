

export class TopicFilter {

    static filter(topics, query) {
        let infoItemFilter = item => item.subject.indexOf(query) !== -1;

        return topics
            .filter(topic => topic.infoItems.some(infoItemFilter))
            .map(topic => {
                let newTopic = Object.assign({}, topic);
                newTopic.infoItems = topic.infoItems.filter(infoItemFilter);
                return newTopic;
            });
    }

}