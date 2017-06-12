import { Meteor } from 'meteor/meteor';
import './collections/users_private';

export class User {
    constructor() {
        this.user = Meteor.user();
    }

    storeSetting(key, value) {
        if (this.user.settings === undefined) {
            this.user.settings = {};
        }
        this.user.settings[key] = value;

        Meteor.call('users.saveSettings', this.user.settings);
    }

    getSetting(key, defaultValue) {
        if (this.user.settings === undefined) {
            return defaultValue;
        }
        const value = this.user.settings[key];
        if (value === undefined){
            return defaultValue;
        }
        return value;
    }
}

export const userSettings = {
    showQuickHelp: {
        meetingSeriesList: 'showQuickHelp_meetingSeriesList',
        meetingSeries:     'showQuickHelp_meetingSeries',
        meeting:           'showQuickHelp_meeting'
    },

    showAddDetail: 'showAddDetail'
};
