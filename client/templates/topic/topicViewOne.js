// TopicViewOne
//
// This is a "view only" for one single topic
// Triggered by the route /topic/:id
// It grabs the topic by ID from the Topics collection
// And displays it with "isEditable: false"

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { TopicSchema } from '/imports/collections/topic.schema';
import { MeetingSeries } from '../../../imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { MinutesFinder } from '../../../imports/services/minutesFinder';
import {Session} from "meteor/session";

let _topicID = undefined;           // this topic ID
let _parentSeriesId = undefined;
Template.topicViewOne.onCreated(function() {
    this.topicReady = new ReactiveVar();

    this.autorun(() => {
        _topicID = FlowRouter.getParam('_id');
        this.subscribe('topicOnlyOne', _topicID, ()=>{  // perform the inner subscription after the outer one is ready
            let aTopic = TopicSchema.getCollection().findOne({_id: _topicID});
            if (aTopic) {
                _parentSeriesId = aTopic.parentId;
                if (_parentSeriesId) {
                    this.subscribe('minutes', _parentSeriesId);
                }
            }
        });
        this.subscribe('meetingSeriesOverview');
        this.topicReady.set(this.subscriptionsReady());
    });
});

Template.topicViewOne.onRendered(function() {
    //add your statement here
});

Template.topicViewOne.onDestroyed(function() {
    //add your statement here
});



Template.topicViewOne.helpers({
    authenticating() {
        const topicReady = Template.instance().topicReady.get();
        return Meteor.loggingIn() || !topicReady;
    },

    redirectIfNotAllowed() {
        let usrRoles = new UserRoles();
        if (_parentSeriesId && !usrRoles.hasViewRoleFor(_parentSeriesId)) {
            FlowRouter.go('/');
        }
    },

    theMeetingSeries() {
        return new MeetingSeries(_parentSeriesId);
    },

    theTopic() {
        let theTopic = TopicSchema.getCollection().findOne({_id: _topicID});
        if (!_topicID || ! theTopic) {
            return undefined;
        }
        return {
            topic: theTopic,
            isEditable: false,
            minutesID: null,
            currentCollapseId: 1,  // each topic item gets its own collapseID,
            parentMeetingSeriesId: _parentSeriesId
        };

    },

    dateOfLastFinalizedMinutes() {
        let ms = new MeetingSeries(_parentSeriesId);
        let aMin = MinutesFinder.lastFinalizedMinutesOfMeetingSeries(ms);
        if (aMin) {
            return aMin.date;
        }
        return 'Never';
    },

    idOfLastFinalizedMinutes() {
        let ms = new MeetingSeries(_parentSeriesId);
        let aMin = MinutesFinder.lastFinalizedMinutesOfMeetingSeries(ms);
        if (aMin) {
            return aMin._id;
        }
        return 'unknown';
    }

});

Template.topicViewOne.events({
    'click #btnGoBack': function () {
        // tell previous tabbed view to restore the last tab
        Session.set('restoreTabAfterBackButton', true);
        window.history.back();
    }
});
