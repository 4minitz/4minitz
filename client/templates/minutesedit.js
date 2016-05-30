import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'

import { TopicListConfig } from './topic/topicsList'

var _minutesID; // the ID of these minutes

Template.minutesedit.onCreated(function () {
    _minutesID = this.data;
});

var isMinuteFinalized = function () {
    let aMin = new Minutes(_minutesID);
    return (aMin && aMin.isFinalized);
};

var isModerator = function () {
    let aMin = new Minutes(_minutesID);
    return (aMin && aMin.isCurrentUserModerator());
};

var toggleTopicSorting = function () {
    let topicList = $('#topicPanel'),
        isFinalized = isMinuteFinalized();

    if (!isFinalized && isModerator()) {
        topicList.sortable('enable');
    }

    if (isFinalized) {
        topicList.sortable('disable');
    }
};

var updateTopicSorting = function () {
    let sorting = $('#topicPanel').find('> div.well'),
        minute = new Minutes(_minutesID),
        newTopicSorting = [];

    for (let i = 0; i < sorting.length; ++i) {
        let topicId = $(sorting[i]).attr('data-id');
        let topic = minute.findTopic(topicId);

        newTopicSorting.push(topic);
    }

    minute.update({topics: newTopicSorting});
};

Template.minutesedit.onRendered(function () {
    let datePickerNode = this.$('#id_minutesdatePicker');
    datePickerNode.datetimepicker({
        format: "YYYY-MM-DD"
    });

    let aMin = new Minutes(_minutesID);
    let ms = aMin.parentMeetingSeries();
    if (ms) {
        let minDate = ms.getMinimumAllowedDateForMinutes(_minutesID);
        if (minDate) {
            minDate.setDate(minDate.getDate() + 1);
            datePickerNode.data("DateTimePicker").minDate(minDate);
        }
    }

    $('#topicPanel').sortable({
        appendTo: document.body,
        axis: 'y',
        items: '> .well',
        opacity: 0.5,
        disabled: true,
        update: updateTopicSorting
    });

    toggleTopicSorting();
});

Template.minutesedit.helpers({
    meetingSeries: function() {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin.parentMeetingSeries();
        }
        return null;
    },

    minutes: function () {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin;
        }
        return null;
    },

    participantsLabelFloating: function () {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return (aMin.participants) ? "" : "label-floating";
        }
        return null;
    },

    isFinalized: function () {
        let aMin = new Minutes(_minutesID);
        return aMin.isFinalized;
    },

    getFinalizedDate: function () {
        let aMin = new Minutes(_minutesID);
        return formatDateISO8601(aMin.finalizedAt);
    },

    getFinalizedBy: function () {
        let aMin = new Minutes(_minutesID);
        return aMin.finalizedBy;
    },

    disableUIControl: function () {
        let aMin = new Minutes(_minutesID);
        let usrRole = new UserRoles();
        return (aMin.isFinalized || !usrRole.isModeratorOf(aMin.parentMeetingSeriesID())) ? "readonly" : "";
    },

    isUnfinalizeAllowed: function () {
        let aMin = new Minutes(_minutesID);
        return aMin.parentMeetingSeries().isUnfinalizeMinutesAllowed(_minutesID);
    },
    
    isModeratorOfParentSeries: function () {
        let aMin = new Minutes(_minutesID);
        let usrRole = new UserRoles();

        return usrRole.isModeratorOf(aMin.parentMeetingSeriesID());
    },

    getTopicsListConfig: function() {
        let aMin = new Minutes(_minutesID);
        return new TopicListConfig(aMin.topics, _minutesID, /*readonly*/ (isMinuteFinalized() || !isModerator()));
    }
});

Template.minutesedit.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "dp.change #id_minutesdatePicker": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            if (aMin.isFinalized) {
                // event will be called on page load
                // if the meeting is already finalized nothing has to be updated
                return;
            }

            let dateNode = tmpl.$("#id_minutesdateInput");
            let aDate = tmpl.find("#id_minutesdateInput").value;


            dateNode.parent().removeClass("has-error");
            if (!aMin.parentMeetingSeries().isMinutesDateAllowed(aMin._id, aDate)) {
                dateNode.parent().addClass("has-error");
                tmpl.find("#id_minutesdateInput").value = aMin.date;
                return;
            }

            aMin.update({date: aDate});
        }
    },


    'click #btn_finalizeMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.finalizeMinutes(aMin);

            toggleTopicSorting();
            Session.set("participants.expand", false);
        }
    },

    'click #btn_unfinalizeMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Un-Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.unfinalizeMinutes(aMin);

            toggleTopicSorting();
            Session.set("participants.expand", true);
            // We need this forked to re-create material checkboxes
            Meteor.setTimeout(function () {
                $.material.init();
            }, 0)
        }
    },

    'click #btn_deleteMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {

            console.log("Remove Meeting Minute " + this._id + " from Series: " + this.meetingSeries_id);

            let dialogContent = "<p>Do you really want to delete this meeting minute dated on <strong>" + aMin.date + "</strong>?</p>";
            let newTopicsCount = aMin.getNewTopics().length;
            if (newTopicsCount > 0) {
                dialogContent += "<p>This will remove <strong>" + newTopicsCount
                    + " Topics</strong>, which were created within this minute.</p>";
            }
            let closedOldTopicsCount = aMin.getOldClosedTopics().length;
            if (closedOldTopicsCount > 0) {
                let additionally = (newTopicsCount > 0) ? "Additionally " : "";
                dialogContent += "<p>" + additionally + "<strong>" + closedOldTopicsCount
                    + " topics</strong> will be opened again, which were closed whithin this minute.</p>"
            }

            confirmationDialog(
                /* callback called if user wants to continue */
                () => {
                    let ms = new MeetingSeries(aMin.meetingSeries_id);
                    ms.removeMinutesWithId(aMin._id);
                    Router.go("/meetingseries/"+aMin.meetingSeries_id)
                },
                /* Dialog content */
                dialogContent
            );

        }
    }

});
