import { DateHelper } from "../lib/date-helper";
import { Random } from "../lib/random";

const { faker } = require("@faker-js/faker");
let extend = require("clone"); // require("xtend");

export class TopicsGenerator {
  /**
   *
   * @param config                                    - Configuration
   * @param config.topicsRange {object}               - Range of topics per
   *     minutes
   * @param config.topicsRange.min {number}           - min. value
   * @param config.topicsRange.max {number}           - max. value
   * @param config.itemsRange {object}                - Range of items per topic
   * @param config.itemsRange.min {number}            - min. value
   * @param config.itemsRange.max {number}            - max. value
   * @param config.detailsSentenceRange.min {number}  - min. value
   * @param config.detailsSentenceRange.max {number}  - max. value
   * @param config.username {string}                  - username
   */
  constructor(config) {
    this.config = config;
    this.seriesTopicList = [];
    this.seriesTopicIdIndexMap = {};
    this.currentTopicList = [];
    this.currentMinutesId = null;
    this.minutesDate = null;
  }

  generateNextListForMinutes(minutesId, minutesDate, isLastOne = false) {
    this.currentMinutesId = minutesId;
    this.minutesDate = minutesDate;

    // generate base list for the following minutes
    // basing on the previous list
    let nextTopicsList = this.currentTopicList.filter((topic) => {
      return !TopicsGenerator._isCompletelyClosed(topic);
    });
    this.currentTopicList = nextTopicsList.map((topic) => {
      let topicClone = extend(topic);
      topicClone.infoItems = topic.infoItems.filter((item) => {
        return item.isOpen;
      });
      return topicClone;
    });

    this._extendExistingTopics();
    this._generateNewTopics();

    // append the current topics to the
    // complete topics list
    this._copyTopicsToSeries(isLastOne);

    // Here we have to clone the whole topics list to make sure
    // it will not be modified by the following one...
    return [...this.currentTopicList].map((topic) => {
      let clone = extend(topic);
      clone.infoItems = [];
      topic.infoItems.forEach((item) => {
        let itemClone = extend(item);
        clone.infoItems.push(itemClone);
      });
      return clone;
    });
  }

  _extendExistingTopics() {
    for (let i = 0; i < this.currentTopicList.length; i++) {
      let topic = this.currentTopicList[i];

      // close action items and add details, randomly
      topic.infoItems.forEach((item) => {
        if (item.itemType === "actionItem" && faker.datatype.boolean()) {
          item.isOpen = false;
        }
        if (faker.datatype.boolean()) {
          item.details.push(this._generateADetail());
        }
      });

      let itemsCount = Random.randomNumber(
        this.config.itemsRange.min,
        this.config.itemsRange.max,
      );
      let start = itemsCount - topic.infoItems.length;
      for (let j = 0; j < start; j++) {
        topic.infoItems.unshift(this._generateANewInfoItem());
      }
    }
  }

  _generateNewTopics() {
    let topicsCount = Random.randomNumber(
      this.config.topicsRange.min,
      this.config.topicsRange.max,
    );
    let start = topicsCount - this.currentTopicList.length;
    for (let i = 0; i < start; i++) {
      this.currentTopicList.unshift(this._generateANewTopic());
    }
  }

  _copyTopicsToSeries(isLastOne = false) {
    this.currentTopicList.forEach((topic) => {
      let topicClone = extend(topic);

      topicClone.infoItems = topicClone.infoItems.filter((item) => {
        return !item.isOpen || isLastOne;
      });

      if (this.seriesTopicIdIndexMap[topic._id] !== undefined) {
        let index = this.seriesTopicIdIndexMap[topic._id];
        let existingTopic = this.seriesTopicList[index];
        topicClone.infoItems.forEach((item) => {
          existingTopic.infoItems.push(item);
        });
      } else {
        topicClone.isOpen = !TopicsGenerator._isCompletelyClosed(topic);
        this.seriesTopicList.push(topicClone);
        this.seriesTopicIdIndexMap[topic._id] = this.seriesTopicList.length - 1;
      }
    });
  }

  _generateANewTopic() {
    let items = this._generateNewInfoItems();

    return {
      _id: Random.generateId(),
      createdInMinute: this.currentMinutesId,
      createdAt: new Date(),
      createdBy: this.config.username,
      updatedAt: new Date(),
      updatedBy: this.config.username,
      subject:
        faker.commerce.department() + " - " + faker.commerce.productName(),
      responsibles: [],
      isOpen: faker.datatype.boolean(),
      isNew: false,
      isRecurring: false,
      isSkipped: false,
      labels: [],
      infoItems: items,
    };
  }

  _generateNewInfoItems() {
    let items = [];
    let itemsCount = Random.randomNumber(
      this.config.itemsRange.min,
      this.config.itemsRange.max,
    );
    for (let i = 0; i < itemsCount; i++) {
      items.push(this._generateANewInfoItem());
    }
    return items;
  }

  _generateANewInfoItem() {
    let isAction = faker.datatype.boolean();
    let item = {
      _id: Random.generateId(),
      createdAt: new Date(),
      createdBy: this.config.username,
      updatedAt: new Date(),
      updatedBy: this.config.username,
      itemType: isAction ? "actionItem" : "infoItem",
      isSticky: false,
      createdInMinute: this.currentMinutesId,
      labels: [],
      subject: faker.lorem.sentence(),
      details: [this._generateADetail()],
    };

    if (isAction) {
      // new action-items are always open,
      // they will be closed in the following minutes randomly.
      item.isOpen = true;
      item.isNew = false;
      item.priority = 3;
      item.responsibles = [];
      item.duedate = DateHelper.formatDateISO8601(faker.date.future());
    }

    return item;
  }

  _generateADetail() {
    let date = this.minutesDate ? this.minutesDate : new Date();
    return {
      _id: Random.generateId(),
      createdAt: new Date(),
      createdBy: this.config.username,
      updatedAt: new Date(),
      updatedBy: this.config.username,
      createdInMinute: this.currentMinutesId,
      date: DateHelper.formatDateISO8601(date),
      text: faker.lorem.sentences(this.config.detailsSentenceRange),
    };
  }

  static _isCompletelyClosed(topic) {
    if (topic.isOpen) {
      return false;
    }
    for (let i = 0; i < topic.infoItems.length; i++) {
      let item = topic.infoItems[i];
      if (item.isOpen) {
        return false;
      }
    }
    return true;
  }
}
