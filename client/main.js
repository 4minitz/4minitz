import { Meteor } from 'meteor/meteor';

if (Meteor.settings.isEnd2EndTest) {
    require('/client/debug/findEventHandlers');
}
