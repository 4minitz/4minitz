import moment from 'moment/moment';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import {ConfirmationDialogFactory} from '../../helpers/confirmationDialogFactory';

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { Minutes } from '/imports/minutes';
import { MinutesFinder } from '/imports/services/minutesFinder';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { DocumentGeneration } from '/imports/documentGeneration';

import { Finalizer } from '/imports/services/finalize-minutes/finalizer';

import { TopicListConfig } from '../topic/topicsList';
import { GlobalSettings } from '/imports/config/GlobalSettings';
import { QualityTestRunner } from '/imports/client/QualityTestRunner';
import { FlashMessage } from '../../helpers/flashMessage';
import { UserTracker } from '../../helpers/userTracker';

let _minutesID; // the ID of these minutes

/**
 *
 * @type {FlashMessage}
 */
let orphanFlashMessage = null;

let filterClosedTopics = new ReactiveVar(false);

let onError = (error) => {
    (new FlashMessage('Error', error.reason)).show();
};

/**
 * togglePrintView
 * Prepares the DOM view for printing - on and off
 * @param switchOn - optional (if missing, function toggles on <=> off)
 */
let togglePrintView = function (switchOn) {
    if (switchOn === undefined) {   // toggle on <=> off
        Session.set('minutesedit.PrintViewActive', ! Session.get('minutesedit.PrintViewActive'));
    } else {
        Session.set('minutesedit.PrintViewActive', switchOn);
    }

    if (Session.get('minutesedit.PrintViewActive')) {
        // expand all topics, but save current state before!
        Session.set('minutesedit.collapsetopics-save4print.'+_minutesID, Session.get('minutesedit.collapsetopics.'+_minutesID));
        Session.set('minutesedit.collapsetopics.'+_minutesID, undefined);

        Session.set('participants.expand', false);
        $('.help').hide();
        Meteor.setTimeout(function(){$('.collapse').addClass('in');}, 100);

        // give collapsibles some time for animation
        Meteor.setTimeout(function(){$('.expand-collapse-triangle').hide();}, 350);
        // as material checkboxes do not print correctly...
        // change material checkbox to normal checkbox for printing
        Meteor.setTimeout(function(){$('div.checkbox').toggleClass('checkbox print-checkbox');}, 360);
        Meteor.setTimeout(function(){openPrintDialog();}, 500);
    } else {
        // change back normal checkboxes to material checkboxes after printing
        $('div.print-checkbox').toggleClass('checkbox print-checkbox');
        $('.expand-collapse-triangle').show();
        $('.collapse').removeClass('in');
        // restore old topic collapsible state
        Session.set('minutesedit.collapsetopics.'+_minutesID, Session.get('minutesedit.collapsetopics-save4print.'+_minutesID));
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
    this.currentMinuteLoaded = new ReactiveVar();

    this.autorun(() => {
        _minutesID = FlowRouter.getParam('_id');

        this.currentMinuteLoaded.set(this.subscribe('minutes', undefined, _minutesID));
        if (this.currentMinuteLoaded.get().ready()) {
            let meetingSeriesId = new Minutes(_minutesID).parentMeetingSeriesID();
            this.subscribe('minutes', meetingSeriesId);
            this.subscribe('meetingSeriesDetails', meetingSeriesId);
            this.subscribe('files.attachments.all', meetingSeriesId, _minutesID);        
            this.subscribe('files.protocols.all', meetingSeriesId, _minutesID);
            
            this.minutesReady.set(this.subscriptionsReady());
        }
    });

    Session.set('minutesedit.checkParent', false);
    handleTemplatesGlobalKeyboardShortcuts(true);

    this.userTracker = new UserTracker(FlowRouter.current().path);
    this.userTracker.onEnter();
});

Template.minutesedit.onDestroyed(function() {
    if (orphanFlashMessage !== null) {
        orphanFlashMessage.hideMe();
    }
    $(window).off('scroll');    // Prohibit accumulating multiple scroll handlers on window
    $(document).unbindArrive('#id_minutesdatePicker');
    $(document).unbindArrive('#topicPanel');
    handleTemplatesGlobalKeyboardShortcuts(false);
    this.userTracker.onLeave();
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

    minute.update({topics: newTopicSorting}).catch(error => {
        $('#topicPanel').sortable( 'cancel' );
        onError(error);
    });
};


let openPrintDialog = function () {
    let ua = navigator.userAgent.toLowerCase();
    let isAndroid = ua.indexOf('android') > -1;

    if (isAndroid && cloudprint && cloudprint.Gadget) { //eslint-disable-line
        // https://developers.google.com/cloud-print/docs/gadget
        let gadget = new cloudprint.Gadget(); //eslint-disable-line
        gadget.setPrintDocument('url', $('title').html(), window.location.href, 'utf-8');
        gadget.openPrintDialog();
    } else {
        window.print();
    }
};

let sendActionItems = true;
let sendInformationItems = true;

Template.minutesedit.helpers({
    setDocumentTitle() {
        let min = new Minutes(_minutesID);
        let ms = min.parentMeetingSeries();
        document.title = `4M! ${ms.name} [${ms.project}] ${min.date}`;
        // Hint: this will be resetted on router's exit hook (see router.js).
    },

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
                format: 'YYYY-MM-DD',
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
                        datePickerNode.data('DateTimePicker').minDate(minDate);
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

        // enable the parent series check after 2.5 seconds delay to make sure
        // there was enough time to update the meeting series
        Meteor.setTimeout(function() {
            Session.set('minutesedit.checkParent', true);
        }, 2500);
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
        return Finalizer.finalizedInfo(_minutesID);
    },

    finalizeHistoryTooltip: function (buttontype) {
        let aMin = new Minutes(_minutesID);
        let tooltip = buttontype ? buttontype+'\n' : '';
        if (aMin.finalizedHistory) {
            tooltip += '\nHistory:\n'+aMin.finalizedHistory.join('\n');
        }
        return tooltip;
    },

    disableUIControl: function () {
        let aMin = new Minutes(_minutesID);
        let usrRole = new UserRoles();
        return (aMin.isFinalized || !usrRole.isModeratorOf(aMin.parentMeetingSeriesID())) ? 'disabled' : '';
    },

    isUnfinalizeAllowed: function () {
        return Finalizer.isUnfinalizeMinutesAllowed(_minutesID);
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
            filteredTopics = aMin.topics.filter((topic) => (topic.isOpen) && (!topic.isSkipped));
        }
        else {
            if (!isModerator()) {
                filteredTopics = aMin.topics.filter((topic) => !topic.isSkipped);
            }
        }

        return new TopicListConfig(filteredTopics, _minutesID, /*readonly*/ (isMinuteFinalized() || !isModerator()), aMin.parentMeetingSeriesID());
    },

    isReadOnly() {
        return (isMinuteFinalized() || !isModerator());
    },

    isPrintView() {
        if (Session.get('minutesedit.PrintViewActive')) {
            return 'btn-info';
        }
    },

    minutesPath: function(minutesId) {
        return Blaze._globalHelpers.pathFor('/minutesedit/:_id', { _id:  minutesId });
    },

    previousMinutes : function() {
        let aMin = new Minutes(_minutesID);
        return MinutesFinder.previousMinutes(aMin);
    },

    nextMinutes : function() {
        let aMin = new Minutes(_minutesID);
        return MinutesFinder.nextMinutes(aMin);
    },

    isDocumentGenerationAllowed : function () {
        return Meteor.settings.public.docGeneration.enabled === true;
    },

    theProtocol : function () {
        return DocumentGeneration.getProtocolForMinute(_minutesID);
    }
});

Template.minutesedit.events({
    'click #checkHideClosedTopics': function(evt) {
        let isChecked = evt.target.checked;
        filterClosedTopics.set(isChecked);
    },

    'dp.change #id_minutesdatePicker': function (evt, tmpl) {
        let aMin = new Minutes(_minutesID);
        if (aMin.isFinalized || ! aMin.isCurrentUserModerator()) {
            // event will be called on page load
            // if the meeting is already finalized ...
            // or the current user is not a moderator ...
            // nothing has to be updated
            return;
        }

        let dateNode = tmpl.$('#id_minutesdateInput');
        let aDate = tmpl.find('#id_minutesdateInput').value;


        dateNode.parent().removeClass('has-error');
        if (!aMin.parentMeetingSeries().isMinutesDateAllowed(aMin._id, aDate)) {
            dateNode.parent().addClass('has-error');
            tmpl.find('#id_minutesdateInput').value = aMin.date;
            return;
        }

        aMin.update({date: aDate}).catch(onError);
    },

    'change #editGlobalNotes' (evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        let globalNote = tmpl.find('#editGlobalNotes').value;
        aMin.update({globalNote: globalNote}).catch(onError);
    },

    'click #btn_sendAgenda': async function(evt, tmpl) {
        evt.preventDefault();
        let sendBtn = tmpl.$('#btn_sendAgenda');
        let aMin = new Minutes(_minutesID);
        console.log('Send agenda: ' + aMin._id + ' from series: ' + aMin.meetingSeries_id);

        let sendAgenda = async () => {
            sendBtn.prop('disabled', true);
            try {
                let result = await aMin.sendAgenda();
                let message = 'Agenda was sent to ' + result + ' recipients successfully';
                (new FlashMessage('OK', message, 'alert-success')).show();
            } catch (error) {
                onError(error);
            }
            sendBtn.prop('disabled', false);
        };

        let agendaCheckDate = async() => {
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
        };

        QualityTestRunner.run(QualityTestRunner.TRIGGERS.sendAgenda, aMin, agendaCheckDate);
    },

    'click #btn_finalizeMinutes': function(evt, tmpl) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        console.log('Finalize minutes: ' + aMin._id + ' from series: ' + aMin.meetingSeries_id);

        let doFinalize = function () {
            tmpl.$('#btn_finalizeMinutes').prop('disabled', true);
            let msg = (new FlashMessage('Finalize in progress', 'This may take a few seconds...', 'alert-info', -1)).show();
            // Force closing the dialog before starting the finalize process
            Meteor.setTimeout(() => {
                Finalizer.finalize(aMin._id, sendActionItems, sendInformationItems, onError);
                tmpl.$('#btn_finalizeMinutes').prop('disabled', true);
                (new FlashMessage('OK', 'This meeting minutes were successfully finalized', FlashMessage.TYPES().SUCCESS, 3000)).show();
                msg.hideMe();
                toggleTopicSorting();
                Session.set('participants.expand', false);
            }, 500);
        };

        let processFinalize = function(){
            if (GlobalSettings.isEMailDeliveryEnabled()) {
                ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
                    doFinalize,
                    'Confirm Finalize Minutes',
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
        };

        QualityTestRunner.run(QualityTestRunner.TRIGGERS.finalize, aMin, processFinalize);
    },

    'click #btn_unfinalizeMinutes': function(evt) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        console.log('Un-Finalize minutes: ' + aMin._id + ' from series: ' + aMin.meetingSeries_id);
        Finalizer.unfinalize(aMin._id);

        toggleTopicSorting();
        Session.set('participants.expand', true);
    },

    'click #btn_deleteMinutes': function(evt) {
        evt.preventDefault();
        let aMin = new Minutes(_minutesID);
        console.log('Remove Meeting Minute ' + this._id + ' from Series: ' + this.meetingSeries_id);

        let deleteMinutesCallback = () => {
            let ms = new MeetingSeries(aMin.meetingSeries_id);
            // first route to the parent meetingseries then remove the minute.
            // otherwise the current route would automatically re-routed to the main page because the
            // minute is not available anymore -> see router.js
            FlowRouter.go('/meetingseries/'+aMin.meetingSeries_id);
            ms.removeMinutesWithId(aMin._id).catch(onError);
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
    },

    'click #btnCollapseAll': function () {
        let aMin = new Minutes(_minutesID);
        let sessionCollapse = {};
        for (let topicIndex in aMin.topics) {
            let topicId = aMin.topics[topicIndex]._id;
            sessionCollapse[topicId] = true;
        }
        Session.set('minutesedit.collapsetopics.'+_minutesID, sessionCollapse);
    },

    'click #btnExpandAll': function () {
        Session.set('minutesedit.collapsetopics.'+_minutesID, undefined);
    },

    'click #btn_printMinutes': function(evt) {
        evt.preventDefault();
        togglePrintView();
    },

    'click #btn_dynamicallyGenerateProtocol': function(evt) {
        evt.preventDefault();

        let noProtocolExistsDialog = (downloadHTML) => {
            ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
                downloadHTML,
                'Confirm generate protocol',
                'confirmPlainText',
                { plainText: 'There has been no protocol generated for these minutes. Do you want to download a dynamically generated HTML version of it instead?'},
                'Download'
            ).show();
        };
        
        DocumentGeneration.downloadMinuteProtocol(_minutesID, noProtocolExistsDialog).catch(onError);
    },

    'click #btnPinGlobalNote': function (evt) {
        evt.preventDefault();
        if (!isModerator() || isMinuteFinalized()) {
            return;
        }
        let aMin = new Minutes(_minutesID);
        aMin.update({globalNotePinned: !aMin.globalNotePinned}).catch(onError);
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
