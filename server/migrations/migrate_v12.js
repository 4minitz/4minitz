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
            if(minutes.topics) {
                if (minutes == this.series.firstMinutes()) {
                minutes = this._updateTopicsOfMinutes(minutes);
                }
                else {
                    let prevMinutes = minutes.previousMinutes();
                    let sameTopics = false;
                    let sameItems = false;
                    minutes.topics.forEach(topic => {
                        //same Topics?
                        if (prevMinutes.topics) {
                            prevMinutes.topics.forEach(prevTopic => {
                                if (topic._id == prevTopic._id) {
                                    sameTopics = true;
                                }
                                if (sameTopics) {
                                    //same Items?
                                    topic.infoItems.forEach(infoItem => {
                                        prevTopic.infoItems.forEach(prevInfoItem => {
                                            if (infoItem._id == prevInfoItem._id) {
                                                sameItems = true;
                                            }
                                            if (sameItems) {
                                                infoItem.details.forEach(detail => {
                                                    prevInfoItem.details.forEach(prevDetail => {
                                                        //same detail-text?
                                                        if (detail.text == prevDetail.text) {
                                                            this._updateDetail(detail, minutes._id, prevDetail);
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                    })

                                }

                            })
                        }
                    })

                    minutes = this._updateTopicsOfMinutes(minutes);
                }
                saveMinutes(minutes);
                minutes = minutes.nextMinutes();
            }
        }
        this._updateTopicsOfSeries();
        saveSeries(this.series);
    }

    /**
     * @param minutes {Minutes}
     * @private
     */
    _updateTopicsOfMinutes(minutes) {
        minutes.topics.forEach(topic => {
            this._updateTopic(topic, minutes._id);
        });
        return minutes;
    }

    _updateTopic(topic, minutesId) {
        topic.infoItems.forEach(infoItem => {
            this._updateInfoItem(infoItem, topic._id);
        });
        return topic;
    }

    _updateInfoItem(infoItem, minutesId){
        infoItem.details.forEach(detail => {
            this._updateDetail(detail, minutesId);
        });

        return infoItem;
    }

    _updateDetail(detail, minutesId, prevDetail){
        if (!minutesId) {
            throw new Meteor.Error('illegal-state', 'Cannot update topic with unknown minutes id');
        }
        if (!prevDetail) {
            if(!detail._id){
                detail._id = Random.id();
                detail.createdInMinute = minutesId;
            }
        }
        else{
            detail._id = prevDetail._id;
            detail.createdInMinute = prevDetail.createdInMinute;
        }
        return detail;

    }

    _updateTopicsOfSeries() {
        this.series.topics.forEach(topic => {
            this._updateTopic(topic, false /*all topics should already exist in map!*/);
        });
        this.series.openTopics.forEach(topic => {
            this._updateTopic(topic, false /*all topics should already exist in map!*/);
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
    }

}