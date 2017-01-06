import { Meteor } from 'meteor/meteor';
import { StatisticsCollection } from './collections/statistics_private';
import _ from 'underscore';

import './collections/statistics_private';
import './helpers/promisedMethods';

export class Statistics {
    constructor(doc) {
        _.extend(this, doc);
    }

    static update() {
        Meteor.call('statistics.update');
    }

    static fetch() {
        return StatisticsCollection.findOne();
    }
}
