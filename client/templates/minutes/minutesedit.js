import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { User, userSettings } from '/imports/users';

import { TopicListConfig } from '../topic/topicsList';
import { GlobalSettings } from '/imports/GlobalSettings';
import { FlashMessage } from '../../helpers/flashMessage';

var _minutesID; // the ID of these minutes

/**
 *
 * @type {FlashMessage}
 */
var orphanFlashMessage = null;

/**
 * togglePrintView
 * Prepares the DOM view for printing - on and off
 * @param switchOn - optional (if missing, function toggles on <=> off)
 */
var togglePrintView = function (switchOn) {
    if (switchOn === undefined) {   // toggle on <=> off
        Session.set("minutesedit.PrintViewActive", ! Session.get("minutesedit.PrintViewActive"));
    } else {
        Session.set("minutesedit.PrintViewActive", switchOn);
    }

    if (Session.get("minutesedit.PrintViewActive")) {
        // expand all topics, but save current state before!
        Session.set("minutesedit.collapsetopics-save4print."+_minutesID, Session.get("minutesedit.collapsetopics."+_minutesID));
        Session.set("minutesedit.collapsetopics."+_minutesID, undefined);

        Session.set("participants.expand", false);
        $(".help").hide();
        Meteor.setTimeout(function(){$(".collapse").addClass("in");}, 100);

        // give collapsibles some time for animation
        Meteor.setTimeout(function(){$(".expand-collapse-triangle").hide();}, 350);
        // as material checkboxes do not print correctly...
        // change material checkbox to normal checkbox for printing
        Meteor.setTimeout(function(){$("div.checkbox").toggleClass('checkbox print-checkbox');}, 360);
        Meteor.setTimeout(function(){openPrintDialog();}, 500);
    } else {
        // change back normal checkboxes to material checkboxes after printing
        $("div.print-checkbox").toggleClass('checkbox print-checkbox');
        $(".expand-collapse-triangle").show();
        $(".collapse").removeClass("in");
        // restore old topic collapsible state
        Session.set("minutesedit.collapsetopics."+_minutesID, Session.get("minutesedit.collapsetopics-save4print."+_minutesID));
    }
};



// Automatically restore view after printing
(function() {
    var afterPrint = function() {
        togglePrintView(false);
    };

    if (window.matchMedia) {
        var mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function(mql) {
            if (! mql.matches) {
                afterPrint();
            }
        });
    }

    window.onafterprint = afterPrint;
}());

Template.minutesedit.onCreated(function () {
    this.autorun(() => {
        _minutesID = FlowRouter.getParam('_id');
        this.subscribe('minutes', _minutesID);

        let usrRoles = new UserRoles();
        let minute = new Minutes(_minutesID);
        if (!usrRoles.hasViewRoleFor(minute.parentMeetingSeriesID())) {
            FlowRouter.redirect('/');
        }
    });

    Session.set('minutesedit.checkParent', false);

    // Collapse the participants list on scroll
    $(window).scroll(function(){
        Session.set("participants.expand", false);
    });
});

Template.minutesedit.onDestroyed(function() {
    if (orphanFlashMessage !== null) {
        orphanFlashMessage.hideMe();
    }
    $(window).off("scroll");    // Prohibit accumulating multiple scroll handlers on window
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


var openPrintDialog = function () {
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1;

    if (isAndroid) {
        // https://developers.google.com/cloud-print/docs/gadget
        var gadget = new cloudprint.Gadget();
        gadget.setPrintDocument("url", $('title').html(), window.location.href, "utf-8");
        gadget.openPrintDialog();
    } else {
        window.print();
    }
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

    // enable the parent series check after 2 seconds delay to make sure
    // there was enough time to update the meeting series
    Meteor.setTimeout(function() {
        Session.set('minutesedit.checkParent', true);
    }, 2000);
});

Template.minutesedit.helpers({
    checkParentSeries: function() {
        if (!Session.get('minutesedit.checkParent')) return;

        let aMin = new Minutes(_minutesID);
        try {
            aMin.checkParent();
            if (orphanFlashMessage !== null) {
                orphanFlashMessage.hideMe();
                orphanFlashMessage = null;
            }
        } catch(error) {
            let msg = 'Unfortunately the minute is not linked to its parent series correctly - please contact your ' +
                'system administrator.';
            orphanFlashMessage = (new FlashMessage('Error', msg, 'alert-danger', -1)).show();
        }
    },

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

    getFinalizedText: function () {
        let aMin = new Minutes(_minutesID);
        return aMin.getFinalizedString();
    },

    finalizeHistoryTooltip: function (buttontype) {
        let aMin = new Minutes(_minutesID);
        let tooltip = buttontype ? buttontype+"\n" : "";
        if (aMin.finalizedHistory) {
            tooltip += "\nHistory:\n"+aMin.finalizedHistory.join("\n");
        }
        return tooltip;
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
    },

    isPrintView() {
        if (Session.get("minutesedit.PrintViewActive")) {
            return "btn-info";
        }
    },

    showQuickHelp: function() {
        const user = new User();
        return user.getSetting(userSettings.showQuickHelp.meeting, true);
    }
});

Template.minutesedit.events({
    "click #btnHideHelp": function () {
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp.meeting, false);
    },
    "dp.change #id_minutesdatePicker": function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            if (aMin.isFinalized || ! aMin.isCurrentUserModerator()) {
                // event will be called on page load
                // if the meeting is already finalized ...
                // or the current user is not a moderator ...
                // nothing has to be updated
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

    "change #editGlobalNotes" (evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let globalNote = tmpl.find("#editGlobalNotes").value;
            aMin.update({globalNote: globalNote});
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
                    let message = "Agenda was sent to " + result + " recipients successfully";
                    (new FlashMessage('OK', message, 'alert-success')).show();
                } catch (error) {
                    (new FlashMessage('Error', error.reason)).show();
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

    'click #btn_finalizeMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("Finalize minutes: " + aMin._id + " from series: " + aMin.meetingSeries_id);

            let doFinalize = function () {
                tmpl.$('#btn_finalizeMinutes').prop("disabled", true);
                let msg = (new FlashMessage('Finalize in progress', 'This may take a few seconds...', 'alert-info', -1)).show();
                // Force closing the dialog before starting the finalize process
                Meteor.setTimeout(() => {
                    aMin.finalize(sendActionItems, sendInformationItems);
                    tmpl.$('#btn_finalizeMinutes').prop("disabled", true);
                    msg.replace('OK', 'This meeting minutes were successfully finalized', 'alert-success', 3000);
                    toggleTopicSorting();
                    Session.set("participants.expand", false);
                }, 500);
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
            aMin.unfinalize();

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
                    FlowRouter.go("/meetingseries/"+aMin.meetingSeries_id);
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
    },

    'click #btn_printMinutes': function(evt) {
        evt.preventDefault();
        togglePrintView();
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
