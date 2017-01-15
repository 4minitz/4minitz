import { Meteor } from 'meteor/meteor';
import { StatisticsCollection } from './collections/statistics_private';
import _ from 'underscore';

import './helpers/promisedMethods';

export class Statistics {
    constructor(doc) {
        _.extend(this, doc);
    }

    static async update() {
        return Meteor.callPromise('statistics.update');
    }

    static fetch() {
        return StatisticsCollection.findOne();
    }
}
