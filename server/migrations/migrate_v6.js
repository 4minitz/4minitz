import { Meteor } from 'meteor/meteor';
import { MinutesSchema } from '/imports/collections/minutes.schema';
import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';
import {updateTopicsOfSeriesPre16} from './helpers/updateSeries';
import {updateTopicsOfMinutes} from './helpers/updateMinutes';

// ActionItems: convert the responsible (string) => responsibles (array) fields
export class MigrateV6 {

    static _upgradeTopics(topics) {
        topics.forEach(topic => {
            topic.infoItems.forEach(item => {
                item.responsibles = [];
                if (item.responsible) {
                    let resp = item.responsible.split(',');
                    resp.forEach((oneResp, index, array) => {
                        oneResp = oneResp.trim();
                        // let's try if this is a valid username. 
                        // If yes: we store this user's _id instead of its name!  
                        let userTry = Meteor.users.findOne({username: oneResp});
                        if (userTry) {
                            oneResp = userTry._id;
                        }
                        array[index] = oneResp; // change value in outer array
                    });
                    item.responsibles = resp;
                    delete item.responsible;
                }
            });
        });
    }

    static _downgradeTopics(topics) {
        topics.forEach(topic => {
            topic.infoItems.forEach(item => {
                item.responsible = '';
                if (item.responsibles && item.responsibles.length) {
                    item.responsible = item.responsibles.join();
                }
                delete item.responsibles;
            });
        });
    }

    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV6._upgradeTopics(minute.topics);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection());
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV6._upgradeTopics(series.openTopics);
            MigrateV6._upgradeTopics(series.topics);
            updateTopicsOfSeriesPre16(series, MeetingSeriesSchema.getCollection());
        });
    }

    static down() {
        MinutesSchema.getCollection().find().forEach(minute => {
            MigrateV6._downgradeTopics(minute.topics);
            updateTopicsOfMinutes(minute, MinutesSchema.getCollection());
        });

        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MigrateV6._downgradeTopics(series.openTopics);
            MigrateV6._downgradeTopics(series.topics);
            updateTopicsOfSeriesPre16(series, MeetingSeriesSchema.getCollection());
        });
    }
}
