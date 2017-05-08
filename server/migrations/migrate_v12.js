import { MinutesCollection } from '/imports/collections/minutes_private';
import { MeetingSeriesCollection } from '/imports/collections/meetingseries_private';

function saveSeries(series) {
    MeetingSeriesCollection.update(
        series._id,
        {
            $set: {
                "topics": series.topics,
                "openTopics": series.openTopics
            }
        },
        { bypassCollection2: true }
    );
}

function saveMinutes(minutes) {
    // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
    MinutesCollection.update(
        minutes._id,
        {
            $set: {
                "topics": minutes.topics,
            }
        },
        { bypassCollection2: true }
    );
}


class MigrateSeriesUp {
    constructor(series) {
        this.topicParentMinuteMap = {};
        this.series = series;
    }

    run() {
        let minutes = this.series.firstMinutes();
        while (minutes) {
            let prevMinutes = minutes.previousMinutes();
            if (prevMinutes){
                // find topics/items/details that occur in a current minute, but were created in a prev. minute
                this._updatePreviousCreatedTopicItemDetails(minutes,prevMinutes);
            }
            minutes = this._updateTopicsOfMinutes(minutes);
            saveMinutes(minutes);
            minutes = minutes.nextMinutes();
        }
        this._updateTopicsOfSeries();
        saveSeries(this.series);
    }

    _updatePreviousCreatedTopicItemDetails(minutes, prevMinutes){
        minutes.topics.forEach(topic => {
            this._updatePreviousCreatedItemDetails(topic, prevMinutes.topics, minutes._id);
        })
    }

    _updatePreviousCreatedItemDetails(topic, prevTopics, minutesId){
        if (!prevTopics) return;
        let prevTopic = prevTopics.find(prevTopic => topic._id === prevTopic._id);
        if (!prevTopic) return;
        topic.infoItems.forEach(infoItem => {
            this._updatePreviousCreatedDetails(infoItem, prevTopic.infoItems, minutesId);
        })
    }

    _updatePreviousCreatedDetails(infoItem, prevItems, minutesId){
        if(!prevItems) return;
        let prevInfoItem = prevItems.find(prevInfoItem => infoItem._id === prevInfoItem._id);
        if (!prevInfoItem) return;
        infoItem.details.forEach(detail =>{
            this._compareDetails(detail, prevInfoItem.details, infoItem, minutesId);
        })
    }

    _compareDetails(detail, prevDetails, infoItem, minutesId){
        prevDetails.forEach(prevDetail => {
            //same detail-text?
            if (detail.text === prevDetail.text) {
                this._updateDetail(detail, infoItem, minutesId, prevDetail);
            }
        })
    }

    _updateTopicsOfMinutes(minutes) {
        minutes.topics.forEach(topic => {
            this._updateTopic(topic, minutes._id);
        });
        return minutes;
    }

    _updateTopic(topic, minutesId) {
        topic.infoItems.forEach(infoItem => {
            this._updateInfoItem(infoItem, minutesId);
        });
        return topic;
    }

    _updateInfoItem(infoItem, minutesId){
        infoItem.details.forEach(detail => {
            this._updateDetail(detail, infoItem, minutesId);
        });
        return infoItem;
    }

    _updateDetail(detail, infoItem, minutesId, prevDetail){
        if (!minutesId) {
            throw new Meteor.Error('illegal-state', 'Cannot update topic with unknown minutes id');
        }
        //for new created details
        if (!prevDetail) {
            if(!detail._id){
                detail._id = Random.id();
                detail.createdInMinute = minutesId;
                this.topicParentMinuteMap[detail.text+infoItem._id] = {id: detail._id, createdInMinute: detail.createdInMinute};
            }
        }
        // for details that were created in a prev. minute but an item is pinned and they occur in the following minute
        else{
            detail._id = prevDetail._id;
            detail.createdInMinute = prevDetail.createdInMinute;
            this.topicParentMinuteMap[detail.text+infoItem._id] = {id: detail._id, createdInMinute: detail.createdInMinute};
        }
        return detail;
    }

    _updateTopicsOfSeries() {
        this.series.topics.forEach(topic => {
            topic.infoItems.forEach(infoItem =>{
                infoItem.details.forEach(detail =>{
                    detail.createdInMinute = this.topicParentMinuteMap[detail.text+infoItem._id].createdInMinute;
                    detail._id = this.topicParentMinuteMap[detail.text+infoItem._id].id;
                })
            })
        });
        this.series.openTopics.forEach(topic => {
            topic.infoItems.forEach(infoItem =>{
                infoItem.details.forEach(detail =>{
                    detail.createdInMinute = this.topicParentMinuteMap[detail.text+infoItem._id].createdInMinute;
                    detail._id = this.topicParentMinuteMap[detail.text+infoItem._id].id;
                })
            })
        });
    }
}

// add _id and "createdInMinute" attribute for details
// --> update all existing topics in all minutes and meeting series!
export class MigrateV12 {

    static up() {
        console.log('% Progress - updating all topics. This might take several minutes...');
        let allSeries = MeetingSeriesCollection.find();
        allSeries.forEach(series => {
            (new MigrateSeriesUp(series)).run();
        });
    }

    static down() {
        MeetingSeriesCollection.find().forEach(series => {
            series.topics = MigrateV12._downgradeTopics(series.topics);
            series.openTopics = MigrateV12._downgradeTopics(series.openTopics);
            saveSeries(series);
        });
        MinutesCollection.find().forEach(minutes => {
            minutes.topics = MigrateV12._downgradeTopics(minutes.topics);
            saveMinutes(minutes);
        });
    }

    static _downgradeTopics(topics) {
        // remove field _id and createdInMinute for each detail in infoItem in each topic
        topics.forEach(topic => {
            topic.infoItems.forEach(item => {
                item.details.forEach(detail =>{
                    delete detail._id;
                    delete detail.createdInMinute;
                })
            })
        });
        return topics;
    }
}