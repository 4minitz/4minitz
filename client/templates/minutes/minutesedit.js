import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'

import { TopicListConfig } from '../topic/topicsList'

import { GlobalSettings } from '/imports/GlobalSettings'

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

var sendActionItems = true;
var sendInformationItems = true;

Template.minutesedit.onRendered(function () {
    let datePickerNode = this.$('#id_minutesdatePicker');
    datePickerNode.datetimepicker({
        format: "YYYY-MM-DD"
    });

    let aMin = new Minutes(_minutesID);
    if (!aMin.isFinalized) {
        let ms = aMin.parentMeetingSeries();
        if (ms) {
            let minDate = ms.getMinimumAllowedDateForMinutes(_minutesID);
            if (minDate) {
                minDate.setDate(minDate.getDate() + 1);
                datePickerNode.data("DateTimePicker").minDate(minDate);
            }
        }
    }

    $('#topicPanel').sortable({
        appendTo: document.body,
        axis: 'y',
        items: '> .well',
        opacity: 0.5,
        disabled: true,
        handle: '.topicDragDropHandle',
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

    isFinalized: function () {
        return isMinuteFinalized();
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
        return new TopicListConfig(aMin.topics, _minutesID, /*readonly*/ (isMinuteFinalized() || !isModerator()), aMin.parentMeetingSeriesID());
    },

    mobileButton() {
        if (Session.get("global.isMobileWidth")) {
            return "btn-xs";
        }
        return "";
    },
    
    isReadOnly() {
        return (isMinuteFinalized() || !isModerator());
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

    'click #btn_sendAgenda': async function(evt, tmpl) {
        evt.preventDefault();
        let sendBtn = tmpl.$("#btn_sendAgenda");
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Send agenda: " + aMin._id + " from series: " + aMin.meetingSeries_id);

            let sendAgenda = async () => {
                sendBtn.prop('disabled', true);
                try {
                    let result = await aMin.sendAgenda();
                    Session.set('errorTitle', 'OK');
                    Session.set('errorReason', "Agenda was sent to " + result + " recipients successfully");
                    Session.set('errorType', "alert-success");
                } catch (error) {
                    Session.set('errorTitle', 'Error');
                    Session.set('errorReason', error.reason);
                }
                sendBtn.prop('disabled', false);
            };

            if (aMin.getAgendaSentAt()) {
                let date = aMin.getAgendaSentAt();

                let dialogContent = "<p>Do you really want to sent the agenda for this meeting minute dated on <strong>"
                    + aMin.date + "</strong>?<br>"
                    + "It was already sent on " + formatDateISO8601(date) + " at " + date.getHours() + ":" + date.getMinutes() + "</p>";


                confirmationDialog(
                    /* callback called if user wants to continue */
                    sendAgenda,
                    /* Dialog content */
                    dialogContent,
                    "Confirm sending agenda",
                    "Send Agenda",
                    "btn-success"
                );
            } else {
                await sendAgenda();
            }
        }
    },

    'click #btn_finalizeMinutes': function(evt) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);
            let parentSeries = aMin.parentMeetingSeries();

            let doFinalize = function () {
                parentSeries.finalizeMinutes(aMin, sendActionItems, sendInformationItems);

                toggleTopicSorting();
                Session.set("participants.expand", false);
            };

            if (GlobalSettings.isEMailDeliveryEnabled()) { // only show confirmation Dialog, if mails can be sent.

                let dialogContent = "<p>Do you really want to finalize this meeting minute dated on <strong>" + aMin.date + "</strong>?";
                if (aMin.hasOpenActionItems()) {
                    dialogContent += "<div class='checkbox form-group'><label for='cbSendAI'><input id='cbSendAI' type='checkbox' class='checkbox' " + ((sendActionItems) ? "checked" : "") + "> send action items</label></div>";
                }
                dialogContent +=
                      "<div class='checkbox form-group'><label for='cbSendII'><input id='cbSendII' type='checkbox' class='checkbox' " + ((sendInformationItems) ? "checked" : "") + "> send information items</label></div>"
                    + "</p>";

                confirmationDialog(
                    /* callback called if user wants to continue */
                    doFinalize,
                    /* Dialog content */
                    dialogContent,
                    "Confirm finalize minute",
                    "Finalize",
                    "btn-success"
                );
            } else {
                doFinalize();
            }

        }
    },

    'click #btn_unfinalizeMinutes': function(evt) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Un-Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);
            let parentSeries = aMin.parentMeetingSeries();
            parentSeries.unfinalizeMinutes(aMin);

            toggleTopicSorting();
            Session.set("participants.expand", true);
        }
    },

    'click #btn_deleteMinutes': function(evt) {
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
                    // first route to the parent meetingseries then remove the minute.
                    // otherwise the current route would automatically re-routed to the main page because the
                    // minute is not available anymore -> see router.js
                    Router.go("/meetingseries/"+aMin.meetingSeries_id);
                    ms.removeMinutesWithId(aMin._id);
                },
                /* Dialog content */
                dialogContent
            );

        }
    },

    "click #btnCollapseAll": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        let sessionCollapse = {};
        for (let topicIndex in aMin.topics) {
            let topicId = aMin.topics[topicIndex]._id;
            sessionCollapse[topicId] = true;
        }
        Session.set("minutesedit.collapsetopics."+_minutesID, sessionCollapse);
    },

    "click #btnExpandAll": function (evt, tmpl) {
        Session.set("minutesedit.collapsetopics."+_minutesID, undefined);
    }
});

// pass event handler for the send-email checkbox to the confirmation dialog
// so we can track changes
Template.confirmationDialog.events({
    'change #cbSendAI': function(evt) {
        sendActionItems = evt.target.checked;
    },
    'change #cbSendII': function(evt) {
        sendInformationItems = evt.target.checked;
    }
});
