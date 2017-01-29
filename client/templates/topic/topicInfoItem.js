import { ReactiveVar } from 'meteor/reactive-var'

import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import { TemplateCreator } from '../../helpers/templateCreator';
import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'
import { InfoItemFactory } from '/imports/InfoItemFactory'
import { ActionItem } from '/imports/actionitem'
import { InfoItem } from '/imports/infoitem'

Template.topicInfoItem.onCreated(function () {
    this.isTopicCollapsed = new ReactiveVar(true);
});

let getMeetingSeriesId = (parentElementId) => {
    let aMin = Minutes.findOne(parentElementId);
    if (aMin) {
        return aMin.parentMeetingSeriesID();
    } else {
        return parentElementId;
    }
};

let createTopic = (parentElementId, topicId) => {
    if (!parentElementId || !topicId) return undefined;
    return new Topic(parentElementId, topicId);
};

let findInfoItem = (parentElementId, topicId, infoItemId) => {
    let aTopic = createTopic(parentElementId, topicId);
    if (aTopic) {
        return aTopic.findInfoItem(infoItemId);
    }
    return undefined;
};

let resizeTextarea = (element) => {
    let scrollPos = $(document).scrollTop();
    element.css('height', 'auto');
    element.css('height', element.prop('scrollHeight') + "px");
    $(document).scrollTop(scrollPos);
};

let addNewDetails = async (tmpl) => {
    tmpl.$('#collapse-' + tmpl.data.currentCollapseId).collapse('show');

    let aMin = new Minutes(tmpl.data.minutesID);
    let aTopic = new Topic(aMin, tmpl.data.parentTopicId);
    let aItem = InfoItemFactory.createInfoItem(aTopic, tmpl.data.infoItem._id);

    aItem.addDetails();
    await  aItem.save();
    let inputEl = tmpl.$('.detailRow').find('.detailInput').last().show();
    tmpl.$('.detailRow').find('.detailActions').last().show();

    inputEl.parent().css('margin', '0 0 25px 0');
    inputEl.show();
    inputEl.focus();
};


Template.topicInfoItem.helpers({
    triggerAddDetails: function() {
        let itemId = Session.get('topicInfoItem.triggerAddDetailsForItem');
        if (itemId && itemId === this.infoItem._id) {
            Session.set('topicInfoItem.triggerAddDetailsForItem', null);
            let tmpl = Template.instance();
            Meteor.setTimeout(() => {
                addNewDetails(tmpl, itemId);
            }, 300); // we need this delay otherwise the input field will be made hidden immediately
        }
        // do not return anything! This will be rendered on the page!
        return '';
    },

    isActionItem: function() {
        return (this.infoItem.itemType === 'actionItem');
    },

    detailsArray: function () {
        return (this.infoItem.details) ? this.infoItem.details : [];
    },

    getLabels: function() {
        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (!aInfoItem) {
            return;
        }
        return aInfoItem.getLabels(getMeetingSeriesId(this.minutesID))
            .map(labelObj => {
                let doc = labelObj.getDocument();
                doc.fontColor = labelObj.hasDarkBackground() ? '#ffffff' : '#000000';

                return doc;
            });
    },

    topicStateClass: function () {
        if (this.infoItem.itemType !== 'actionItem') {
            return "infoitem";
        } else if (this.infoItem.isOpen) {
            return "actionitem-open";
        } else {
            return "actionitem-closed";
        }
    },

    checkedState: function () {
        if (this.infoItem.itemType === 'infoItem' || this.infoItem.isOpen) {
            return "";
        } else {
            return {checked: "checked"};
        }
    },

    disabledState: function () {
        if (this.isEditable) {
            return "";
        } else {
            return {disabled: "disabled"};
        }
    },

    isCollapsed() {
        return Template.instance().isTopicCollapsed.get();
    },

    showPinItem() {
        return (this.infoItem.itemType === 'infoItem' && ( this.isEditable || this.infoItem.isSticky) );
    },

    responsiblesHelper() {
        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            if (aInfoItem.hasResponsibles()) {
                return "(" + aInfoItem.getResponsibleNameString() + ")";
            }
        }
        return "";
    },

    classForEdit() {
        return this.isEditable ? "btnEditInfoItem" : "";
    },
    cursorForEdit() {
        return this.isEditable ? "pointer" : "";
    }
});



Template.topicInfoItem.events({
    'click #btnDelInfoItem'(evt) {
        evt.preventDefault();

        let aTopic = createTopic(this.minutesID, this.parentTopicId);
        if (aTopic) {
            let template = TemplateCreator.create('Do you really want to delete the {{type}} <strong>{{subject}}</strong>?');
            let templateData = {
                type: (this.infoItem.itemType === 'infoItem') ? 'information' : 'action item',
                subject: this.infoItem.subject
            };

            ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                () => { aTopic.removeInfoItem(this.infoItem._id) },
                'Confirm delete',
                template,
                templateData
            ).show();
        }
    },

    'click .btnToggleAIState'(evt) {
        evt.preventDefault();

        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            aInfoItem.toggleState();
            aInfoItem.save();
        }
    },

    'click .btnPinInfoItem'(evt) {
        evt.preventDefault();

        if (!this.isEditable) {
            return;
        }

        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof InfoItem) {
            aInfoItem.toggleSticky();
            aInfoItem.save();
        }
    },

    'click #btnEditInfoItem'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }
        if (getSelection().toString()) {    // don't fire while selection is ongoing
            return;
        }

        Session.set("topicInfoItemEditTopicId", this.parentTopicId);
        Session.set("topicInfoItemEditInfoItemId", this.infoItem._id);
        $("#dlgAddInfoItem").modal("show");
    },


    // Keep <a href=...> as clickable links inside detailText markdown
    'click .detailText a'(evt, tmpl) {
        evt.stopPropagation();
    },


    'click .detailText'(evt, tmpl) {
        evt.preventDefault();

        if (!tmpl.data.isEditable) {
            return;
        }
        if (getSelection().toString()) {    // don't fire while selection is ongoing
            return;
        }

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);
        let detailActionsId = tmpl.$('#detailActions_' + detailId);

        if (inputEl.val() !== "") {
            return;
        }

        textEl.hide();
        inputEl.show();
        detailActionsId.show();

        inputEl.val(textEl.attr('data-text'));
        inputEl.parent().css('margin', '0 0 25px 0');
        inputEl.focus();
        resizeTextarea(inputEl);
    },

    async 'click .addDetail'(evt, tmpl) {
        evt.preventDefault();
        addNewDetails(tmpl);
    },

    'blur .detailInput'(evt, tmpl) {
        evt.preventDefault();

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);
        let detailActionsEl = tmpl.$('#detailActions_' + detailId);


        let text = inputEl.val().trim();

        if (text === "" || (text !== textEl.attr('data-text'))) {
            let aMin = new Minutes(tmpl.data.minutesID);
            let aTopic = new Topic(aMin, tmpl.data.parentTopicId);
            let aActionItem = InfoItemFactory.createInfoItem(aTopic, tmpl.data.infoItem._id);
            let index = detailId.split('_')[2]; // detail id is: <collapseId>_<index>
            if (text !== "") {
                aActionItem.updateDetails(index, text);
                aActionItem.save();
            } else {
                let deleteDetails = () => {
                    aActionItem.removeDetails(index);
                    aActionItem.save();
                    let detailsCount = aActionItem.getDetails().length;
                    if (detailsCount === 0) {
                        tmpl.$('#collapse-' + tmpl.data.currentCollapseId).collapse('hide');
                    }
                };

                let oldText = aActionItem.getDetailsAt(index).text;
                if (!oldText || oldText === "") {
                    // use case: Adding details and leaving the input field without entering any text should go silently.
                    deleteDetails();
                } else {
                    // otherwise we show an confirmation dialog before the deails will be removed
                    let dialogTmpl = TemplateCreator.create(
                        '<p>Do you really want to delete the selected details of the item <strong>{{subject}}</strong>?</p>');
                    ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                        deleteDetails,
                        'Confirm delete',
                        dialogTmpl,
                        {subject: aActionItem.getSubject()}
                    ).show();
                }
            }
        }

        inputEl.val("");
        inputEl.hide();
        detailActionsEl.hide();

        textEl.show();
    },

    'keypress .detailInput'(evt, tmpl) {
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);
        if (evt.which === 13/*enter*/ && evt.ctrlKey) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    'keyup .detailInput'(evt, tmpl) {
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);

        // escape key will not be handled in keypress callback...
        if (evt.which === 27/*escape*/) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    "hide.bs.collapse"(evt, tmpl) {
        tmpl.isTopicCollapsed.set(true);
    },
    "show.bs.collapse"(evt, tmpl) {
        tmpl.isTopicCollapsed.set(false);
    },

    // Important! We have to use "mousedown" instead of "click" here.
    // -> for more details see next event handler
    "mousedown .detailInputDelete"(evt, tmpl) {
        evt.preventDefault();
        evt.stopPropagation();
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);
        inputEl.val('');
        inputEl.blur();
    },

    // Important! We have to use "mousedown" instead of "click" here.
    // Otherwise the detailsEdit textarea will loose focus and trigger
    // its blur-event which in turn makes the markdownhint icon invisible
    // which in turn swallow the click event - and nothing happens on click.
    "mousedown .detailInputMarkdownHint"(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        ConfirmationDialogFactory
            .makeInfoDialog('Help for Markdown Syntax')
            .setTemplate('markdownHint')
            .show();

    }
});
