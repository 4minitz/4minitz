import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'
import { AttachmentsCollection } from "/imports/collections/attachments_private"

let _minutesID; // the ID of these minutes


Template.minutesAttachments.onCreated(function() {
    this.currentUpload = new ReactiveVar(false);
    _minutesID = this.data._id;
    console.log("minutesAttachment on minutes.id:"+_minutesID);
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

    attachments() {
        return AttachmentsCollection.find({"meta.meetingminutes_id": _minutesID});
    },

    currentUpload() {
        return Template.instance().currentUpload.get();
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
    }
});

Template.minutesAttachments.events({
    'change #fileInput': function (e, template) {
        if (e.currentTarget.files && e.currentTarget.files[0]) {
            // We upload only one file, in case
            // multiple files were selected
            console.log("Uploading... "+e.currentTarget.files[0]);
            let min = new Minutes(_minutesID);
            let upload = AttachmentsCollection.insert({
                file: e.currentTarget.files[0],
                streams: 'dynamic',
                chunkSize: 'dynamic',
                meta: {
                        meetingminutes_id: _minutesID,
                        parentseries_id: min.parentMeetingSeriesID()
                      }
            }, false);

            upload.on('start', function () {
                template.currentUpload.set(this);
            });
            upload.on('end', function (error, fileObj) {
                if (error) {
                    confirmationDialog(
                        () => {},   // do nothing...
                        /* Dialog content */
                        "" + error,
                        "Error during upload",
                        "OK",
                        "btn-success",
                        true /* hide cancel button */
                    );
                }
                template.currentUpload.set(false);
            });
            upload.on('abort', function (error, fileObj) {
                console.log("Upload of attachment was aborted.");
                template.currentUpload.set(false);
            });

            upload.start();
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
    }

});
