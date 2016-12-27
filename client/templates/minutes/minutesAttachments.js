import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'
import { AttachmentsCollection } from '/imports/collections/attachments_private'
import { Attachment } from '/imports/attachment'

let _minutesID; // the ID of these minutes


Template.minutesAttachments.onCreated(function() {
    this.currentUpload = new ReactiveVar(false);
    _minutesID = this.data._id;
    console.log("minutesAttachment on minutes.id:"+_minutesID);

    // Calculate initial expanded/collapsed state
    Session.set("attachments.expand", true);
    if (Attachment.countForMinutes(_minutesID) == 0) {
        Session.set("attachments.expand", false);
    }
});

Template.minutesAttachments.onRendered(function() {
    //add your statement here
});

Template.minutesAttachments.onDestroyed(function() {
    //add your statement here
});


Template.minutesAttachments.helpers({
    attachmentsEnabled() {
        return Meteor.settings.public.attachments.enabled;
    },

    isAttachmentsExpanded() {
        return Session.get("attachments.expand");
    },

    attachments() {
        return Attachment.findForMinutes(_minutesID);
    },

    attachmentsCount() {
        const count = Attachment.countForMinutes(_minutesID);
        return count == 1 ? count + " file" : count + " files";
    },

    currentUpload() {
        return Template.instance().currentUpload.get();
    },

    // some responsive CSS tweaking
    useClassWell() {
        if (! Session.get("global.isMobileWidth")) {
            return "well";
        }
    },
    useStylePadding() {
        if (! Session.get("global.isMobileWidth")) {
            return "padding-left: 1.5em;";
        }
    },

    showUploadButton() {
        let min = new Minutes(_minutesID);
        let ur = new UserRoles();
        if (! min.isFinalized && ur.isUploaderFor(min.parentMeetingSeriesID())) {
            return true;
        }
        return false;
    },

    showAttachmentRemoveButton() {
        let min = new Minutes(_minutesID);
        let file = this.fetch()[0]; // this is an attachment cursor in this context, so get "first" object of array
        try {
            let attachment = new Attachment(file._id);
            if (attachment.mayRemove()) {
                return true;
            }
            return false;
        } catch(err) {
            // when attachment is in the process of being removed
            // new Attachment(id) may fail...
            // we handle this situation gracefully
            return false;
        }
    },

    uploadSpeed() {
        if (Template.instance().currentUpload.get()
            && Template.instance().currentUpload.get().state.get() == "active") {
            let speed = Template.instance().currentUpload.get().estimateSpeed.get();
            speed = speed / 1024 / 1024;
            return "@"+speed.toFixed(2)+" MB/s";
        }
        return "";
    },

    timeToFinish() {
        if (Template.instance().currentUpload.get()
            && Template.instance().currentUpload.get().state.get() == "active") {
            let time = Template.instance().currentUpload.get().estimateTime.get();
            time = global.msToHHMMSS(time);
            return time+ " remaining";
        }
        return "";
    },

    uploaderUsername() {
        let file = this.fetch()[0]; // this is an attachment cursor in this context, so get "first" object of array
        let usr = Meteor.users.findOne(file.userId);
        return usr.username;
    },

    uploadTimestamp() {
        let file = this.fetch()[0]; // this is an attachment cursor in this context, so get "first" object of array
        return (global.formatDateISO8601Time(file.meta.timestamp));
    }
});

Template.minutesAttachments.events({
    'change #fileInput': function (e, template) {
        if (e.currentTarget.files && e.currentTarget.files[0]) {
            // We upload only one file, in case
            // multiple files were selected
            const uploadFilename = e.currentTarget.files[0];
            console.log("Uploading... "+uploadFilename);
            let minObj = new Minutes(_minutesID);
            Attachment.uploadFile(uploadFilename, minObj, template.currentUpload);
        }
    },

    "click #btnDelAttachment": function (evt, tmpl) {
        evt.preventDefault();
        console.log("Remove Attachment: "+this._id);
        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                Meteor.call("attachments.remove", this._id);
            },
            /* Dialog content */
            "Do you really want to delete the attachment<br><b>"+this.name+"</b>?"
        );
    },

    "click #btnToggleUpload": function (e) {
        e.preventDefault();
        this.toggle();
        return false;
    },

    "click #btnAbortUpload": function (e) {
        e.preventDefault();
        this.abort();
        return false;
    },

    "click #btnAttachmentsExpand" () {
        Session.set("attachments.expand", !Session.get("attachments.expand"));
    }
});
