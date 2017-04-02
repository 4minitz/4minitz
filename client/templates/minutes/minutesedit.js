import moment from 'moment/moment';

import {ConfirmationDialogFactory} from '../../helpers/confirmationDialogFactory';

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { User, userSettings } from '/imports/users';

import { TopicListConfig } from '../topic/topicsList';
import { GlobalSettings } from '/imports/GlobalSettings';
import { FlashMessage } from '../../helpers/flashMessage';

let _minutesID; // the ID of these minutes

/**
 *
 * @type {FlashMessage}
 */
let orphanFlashMessage = null;

let filterClosedTopics = new ReactiveVar(false);

/**
 * togglePrintView
 * Prepares the DOM view for printing - on and off
 * @param switchOn - optional (if missing, function toggles on <=> off)
 */
let togglePrintView = function (switchOn) {
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
    let afterPrint = function() {
        togglePrintView(false);
    };

    if (window.matchMedia) {
        let mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function(mql) {
            if (! mql.matches) {
                afterPrint();
            }
        });
    }

    window.onafterprint = afterPrint;
}());


// Global keyboard shortcut handler for this template
// In Meteor global key events can only be bound to the template on <INPUT> elements
// If we want to have these key events really global, we have to register them with
// the document. For details see SO:
// http://stackoverflow.com/questions/27972873/meteor-keydown-keyup-events-outside-input
let handleTemplatesGlobalKeyboardShortcuts = function(switchOn) {
    if (switchOn) {
        $(document).keydown( function(evt) {
            if ($('.modal.in').length > 0) {    // any modal dialog open?
                return;
            }
            // console.log("keydown", evt);
            // check if focus is in input-text or input-textarea
            // let el = document.activeElement;
            // if (el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
            //     el.tagName.toLowerCase() == 'textarea')) {
            //     return;
            // }

            // Listen for "Ctrl+Alt+T" for "Add Topic" (Alt+T in IE11)
            // accesskey attribute is not an option, as it needs browser specific modifieres
            // (see www.w3schools.com/tags/att_global_accesskey.asp) and
            // accessKeyLabel is not implemented in all browsers
            if (evt.ctrlKey && evt.altKey && !evt.shiftKey &&
                evt.keyCode === 84) {
                $('#dlgAddTopic').modal('show');
                evt.preventDefault();
            }
        });
    } else {
        $(document).off('keydown');
    }
};

Template.minutesedit.onCreated(function () {
    this.minutesReady = new ReactiveVar();

    this.autorun(() => {
        _minutesID = FlowRouter.getParam('_id');
        let subscriptionHandle = this.subscribe('minutes', _minutesID);

        this.minutesReady.set(subscriptionHandle.ready());
    });

    Session.set('minutesedit.checkParent', false);
    handleTemplatesGlobalKeyboardShortcuts(true);
});

Template.minutesedit.onDestroyed(function() {
    if (orphanFlashMessage !== null) {
        orphanFlashMessage.hideMe();
    }
    $(window).off("scroll");    // Prohibit accumulating multiple scroll handlers on window
    $(document).unbindArrive('#id_minutesdatePicker');
    $(document).unbindArrive('#topicPanel');
    handleTemplatesGlobalKeyboardShortcuts(false);
});

let isMinuteFinalized = function () {
    let aMin = new Minutes(_minutesID);
    return (aMin && aMin.isFinalized);
};

let isModerator = function () {
    let aMin = new Minutes(_minutesID);
    return (aMin && aMin.isCurrentUserModerator());
};

let toggleTopicSorting = function () {
    let topicList = $('#topicPanel'),
        isFinalized = isMinuteFinalized();

    if (!isFinalized && isModerator()) {
        topicList.sortable('enable');
    }

    if (isFinalized) {
        topicList.sortable('disable');
    }
};

let updateTopicSorting = function () {
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


let openPrintDialog = function () {
    let ua = navigator.userAgent.toLowerCase();
    let isAndroid = ua.indexOf("android") > -1;

    if (isAndroid) {
        // https://developers.google.com/cloud-print/docs/gadget
        let gadget = new cloudprint.Gadget();
        gadget.setPrintDocument("url", $('title').html(), window.location.href, "utf-8");
        gadget.openPrintDialog();
    } else {
        window.print();
    }
};

let sendActionItems = true;
let sendInformationItems = true;

Template.minutesedit.helpers({
    authenticating() {
        const subscriptionReady = Template.instance().minutesReady.get();
        return Meteor.loggingIn() || !subscriptionReady;
    },

    canShow() {
        let usrRoles = new UserRoles();

        let minute = new Minutes(_minutesID);
        if (!usrRoles.hasViewRoleFor(minute.parentMeetingSeriesID())) {
            FlowRouter.redirect('/');
        }

        return true;
    },

    initialize() {
        let templateInstance = Template.instance();

        $(document).arrive('#id_minutesdatePicker', () => {
            // Configure DateTimePicker
            moment.locale('en', {
                week: { dow: 1 } // Monday is the first day of the week
            });

            let datePickerNode = templateInstance.$('#id_minutesdatePicker');
            // see http://eonasdan.github.io/bootstrap-datetimepicker/Options/
            datePickerNode.datetimepicker({
                format: "YYYY-MM-DD",
                // calendarWeeks: true, // unfortunately this leads to "NaN" weeks on some systems...
                showTodayButton: true
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
        });

        $(document).arrive('#topicPanel', () => {
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

        // enable the parent series check after 2 seconds delay to make sure
        // there was enough time to update the meeting series
        Meteor.setTimeout(function() {
            Session.set('minutesedit.checkParent', true);
        }, 2000);
    },

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
        return (aMin.isFinalized || !usrRole.isModeratorOf(aMin.parentMeetingSeriesID())) ? "disabled" : "";
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
        let filteredTopics = aMin.topics;
        if (filterClosedTopics.get()){
            filteredTopics = aMin.topics.filter((topic) => topic.isOpen);
        }
        return new TopicListConfig(filteredTopics, _minutesID, /*readonly*/ (isMinuteFinalized() || !isModerator()), aMin.parentMeetingSeriesID());
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
    },
    
    previousMinutes : function() {
        let prevMinutes = null;
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let meetingSeries = aMin.parentMeetingSeries();
            let arrayPosition = meetingSeries.minutes.indexOf(_minutesID);
            if (arrayPosition > 0){
                let prevMinutesID = meetingSeries.minutes[arrayPosition - 1];
                prevMinutes = new Minutes(prevMinutesID);
                let route = Blaze._globalHelpers.pathFor("/minutesedit/:_id", { _id:  prevMinutes._id });
                return "Previous: <a id='btnPreviousMinutesNavigation' href='" + route + "'>" + prevMinutes.date + "</a> &nbsp;&nbsp;";
            }
        }
    },
    
    nextMinutes : function() {
        let nextMinutes = null;
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let meetingSeries = aMin.parentMeetingSeries();
            let arrayposition = meetingSeries.minutes.indexOf(_minutesID);
            let nextMinuteArrayPosition = arrayposition + 1;
            if ((nextMinuteArrayPosition > -1) && (nextMinuteArrayPosition < meetingSeries.minutes.length)) {
                let nextMinutesID = meetingSeries.minutes[nextMinuteArrayPosition];
                nextMinutes = new Minutes(nextMinutesID);
                let route = Blaze._globalHelpers.pathFor("/minutesedit/:_id", { _id:  nextMinutes._id });
                return "Next: <a id='btnNextMinutesNavigation' href='" + route + "'>" + nextMinutes.date + "</a>";
            }
        }
    }
});

Template.minutesedit.events({
    "click #btnHideHelp": function () {
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp.meeting, false);
    },

    "click #checkHideClosedTopics": function(evt) {
        let isChecked = evt.target.checked;
        filterClosedTopics.set(isChecked);
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
                console.log(date);

                ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
                    sendAgenda,
                    'Confirm sending agenda',
                    'confirmSendAgenda',
                    {
                        minDate: aMin.date,
                        agendaSentDate: moment(date).format('YYYY-MM-DD'),
                        agendaSentTime: moment(date).format('h:mm')
                    },
                    'Send Agenda'
                ).show();
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

            if (GlobalSettings.isEMailDeliveryEnabled()) {
                ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
                    doFinalize,
                    'Confirm finalize minutes',
                    'confirmationDialogFinalize',
                    {
                        minutesDate: aMin.date,
                        hasOpenActionItems: aMin.hasOpenActionItems(),
                        sendActionItems: (sendActionItems) ? 'checked' : '',
                        sendInformationItems: (sendInformationItems) ? 'checked' : ''
                    },
                    'Finalize'
                ).show();
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

            let deleteMinutesCallback = () => {
                let ms = new MeetingSeries(aMin.meetingSeries_id);
                // first route to the parent meetingseries then remove the minute.
                // otherwise the current route would automatically re-routed to the main page because the
                // minute is not available anymore -> see router.js
                FlowRouter.go("/meetingseries/"+aMin.meetingSeries_id);
                ms.removeMinutesWithId(aMin._id);
            };

            let newTopicsCount = aMin.getNewTopics().length;
            let closedOldTopicsCount = aMin.getOldClosedTopics().length;

            let tmplData = {
                minutesDate: aMin.date,
                hasNewTopics: (newTopicsCount > 0),
                newTopicsCount: newTopicsCount,
                hasClosedTopics: (closedOldTopicsCount > 0),
                closedTopicsCount: closedOldTopicsCount
            };

            ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                deleteMinutesCallback,
                'Confirm delete',
                'confirmationDialogDeleteMinutes',
                tmplData
            ).show();
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
