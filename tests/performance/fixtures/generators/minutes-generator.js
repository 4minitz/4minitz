import { Random } from '../lib/random';
import moment from 'moment/moment';
require('../../../../lib/helpers');

export class MinutesGenerator {
    /**
     *
     * @param config                        - Configuration
     * @param config.minutesCount {number}  - amount of minutes which should be generated
     * @param parentSeriesId
     * @param user
     * @param nextMinutesDate
     */
    constructor(config, parentSeriesId, user, nextMinutesDate = new Date()) {
        this.config = config;
        this.parentSeriesId = parentSeriesId;
        this.user = user;
        this.nextMinutesDate = nextMinutesDate;
    }

    generate() {
        let result = [];
        let lastMin = false;
        for(let i=0; i<this.config.minutesCount; i++) {
            let isLastOne = ( (i+1) === this.config.minutesCount );
            let topics = (lastMin) ? lastMin.topics : [];
            lastMin = this.generateOne(topics, isLastOne);
            result.push(lastMin);
            this._tickOneDay();
        }

        return result;
    }

    generateOne(topics = [], isLastOne = false) {
        let min = {
            _id: Random.generateId(),
            meetingSeries_id: this.parentSeriesId,
            date: this.constructor._formatDate(this.nextMinutesDate),
            topics: topics,
            visibleFor: [this.user._id],
            participants: [{userId: this.user._id, present:false, minuteKeeper: false}],
            createdAt: new Date(),
            isFinalized: !isLastOne,
            globalNote: '',
            participantsAdditional: '',
            finalizedVersion: isLastOne ? 1 : 0,
            finalizedHistory: []
        };

        if (isLastOne) {
            min.finalizedAt = this.nextMinutesDate;
            min.finalizedBy = this.user.username;
            let dateTime = this.constructor._formatDateTime(this.nextMinutesDate);
            min.finalizedHistory.push(`Version 1. Finalized on ${dateTime} by ${this.user.username}`);
        }
        return min;
    }

    _tickOneDay() {
        this.nextMinutesDate = moment(this.nextMinutesDate).add(1, 'days').toDate();
    }

    static _formatDate(date) {
        return formatDateISO8601(date);
    }

    static _formatDateTime(date) {
        return formatDateISO8601Time(date);
    }


}