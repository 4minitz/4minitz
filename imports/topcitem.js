/**
 * Created by felix on 09.05.16.
 */

import { Topic } from './topic'

/**
 * A TopicItem is a sub-element of
 * a topic which has a subject,
 * a date when is was created
 * and a list of associated tags.
 */
export class TopicItem {

    constructor(parentTopic, source) {
        if (!parentTopic || !source)
            throw new Meteor.Error("It is not allowed to create a TopicItem without the parentTopicId and the source");

        this._parentTopic = undefined;
        this._topicItemDoc = undefined;

        if (typeof parentTopic === 'object') {   // we have a topic object here.
            this._parentTopic = parentTopic;
        }
        if (!this._parentTopic) {
            throw new Meteor.Error("No parent Topic given!");
        }

        if (typeof source === 'string') {   // we may have an ID here.
            source = this._parentTopic.findTopicItem(source);
        }

        this._topicItemDoc = source;
    }

    save() {
        // caution: this will update the entire topics array from the parent minutes of the parent topic!
        this._parentTopic.save();
    }

    toString () {
        return "TopicItem: " + JSON.stringify(this._topicItemDoc, null, 4);
    }

    log () {
        console.log(this.toString());
    }

}