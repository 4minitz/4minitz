import { Random } from '../lib/random';
import { DateHelper } from '../lib/date-helper';
let faker = require('faker');
let extend = require("xtend");

export class TopicsGenerator {

    /**
     *
     * @param config                            - Configuration
     * @param config.minutesCount {number}      - amount of minutes which should be generated
     * @param config.topicsRange {object}       - Range of topics per minutes
     * @param config.topicsRange.min {number}   - min. value
     * @param config.topicsRange.max {number}   - max. value
     * @param config.itemsRange {object}        - Range of items per topic
     * @param config.itemsRange.min {number}   - min. value
     * @param config.itemsRange.max {number}   - max. value
     */
    constructor(config) {
        this.config = config;
        this.seriesTopicList = [];
        this.seriesTopicIdIndexMap = {};
        this.currentTopicList = [];
        this.currentMinutesId = null;
    }

    generateNextListForMinutes(minutesId) {
        this.currentMinutesId = minutesId;

        // generate base list for the following minutes
        // basing on the previous list
        let nextTopicsList = this.currentTopicList.filter(topic => {
            return !TopicsGenerator._isCompletelyClosed(topic);
        });
        this.currentTopicList = nextTopicsList.map(topic => {
            let topicClone = extend(topic);
            topicClone.infoItems = topic.infoItems.filter(item => {
                return (item.isOpen);
            });
        });

        this._extendExistingTopics();
        this._generateNewTopics();

        // append the current topics to the
        // complete topics list
        this._copyTopicsToSeries();


        return this.currentTopicList;
    }

    _extendExistingTopics() {
        for(let i=0; i<this.currentTopicList.length; i++) {
            let topic = this.currentTopicList[i];
            let itemsCount = Random.randomNumber(this.config.itemsRange.min, this.config.itemsRange.max);
            let start = itemsCount - topic.infoItems.length;
            for (let j=0; j<start;j++) {
                topic.infoItems.unshift(this._generateANewInfoItem());
            }
        }
    }

    _generateNewTopics() {
        let topicsCount = Random.randomNumber(this.config.topicsRange.min, this.config.topicsRange.max);
        let start = topicsCount - this.currentTopicList.length;
        for (let i=0; i<start;i++) {
            this.currentTopicList.unshift(this._generateANewTopic());
        }
    }

    _copyTopicsToSeries() {
        this.currentTopicList.forEach(topic => {
            let topicClone = extend(topic);

            topicClone.infoItems = topicClone.infoItems.filter(item => {
                return !item.isOpen;
            });

            if (this.seriesTopicIdIndexMap[topic._id] !== undefined) {
                let index = this.seriesTopicIdIndexMap[topic._id];
                let existingTopic = this.seriesTopicList[index];
                topicClone.infoItems.forEach(item => {
                    existingTopic.infoItems.push(item);
                });

            } else {
                topicClone.isOpen = !TopicsGenerator._isCompletelyClosed(topic);
                this.seriesTopicList.push(topicClone);
                this.seriesTopicIdIndexMap[topic._id] = (this.seriesTopicList.length - 1);
            }
        });
    }

    _generateANewTopic() {
        let items = this._generateNewInfoItems();

        return {
            _id: Random.generateId(),
            subject: faker.commerce.department(),
            responsibles: [],
            isOpen: faker.random.boolean(),
            isNew: false,
            isRecurring: false,
            labels: [],
            infoItems: items
        };
    }

    _generateNewInfoItems() {
        let items = [];
        let itemsCount = Random.randomNumber(this.config.itemsRange.min, this.config.itemsRange.max);
        for(let i=0; i< itemsCount; i++) {
            items.push(this._generateANewInfoItem());
        }
        return items;
    }

    _generateANewInfoItem() {
        let isAction = faker.random.boolean();
        let item = {
            _id: Random.generateId(),
            itemType: (isAction) ? 'actionItem' : 'infoItem',
            isSticky: false,
            createdInMinute: this.currentMinutesId,
            labels: [],
            subject: faker.lorem.sentence(),
            details: []
        };

        if (isAction) {
            item.isOpen = faker.random.boolean();
            item.isNew = false;
            item.responsibles = [];
            item.duedate = DateHelper.formatDateISO8601(faker.date.future());
        }

        return item;
    }

    static _isCompletelyClosed(topic) {
        if (topic.isOpen) {
            return false;
        }
        for (let i=0; i<topic.infoItems.length; i++) {
            let item = topic.infoItems[i];
            if (item.isOpen) {
                return false;
            }
        }
        return true;
    }
}