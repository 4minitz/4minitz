import { Meteor } from 'meteor/meteor';

import { AttachmentsCollection } from "/imports/collections/attachments_private"


Template.minutesAttachments.helpers({
    currentUpload() {
        return Template.instance().currentUpload.get();
    },

    uploadSpeedMB() {
        let speed = Template.instance().currentUpload.get().estimateSpeed.get();
        speed = speed / 1024 / 1024;
        return speed.toFixed(2);
    },

    timeToFinish() {
        let time = Template.instance().currentUpload.get().estimateTime.get();
        time = global.msToHHMMSS(time);

        return time;
    },

    attachments() {
        return AttachmentsCollection.find();
    },
});

Template.minutesAttachments.events({
    'change #fileInput': function (e, template) {
        if (e.currentTarget.files && e.currentTarget.files[0]) {
            // We upload only one file, in case
            // multiple files were selected
            console.log(e.currentTarget.files[0]);
            console.log(AttachmentsCollection);
            let upload = AttachmentsCollection.insert({
                file: e.currentTarget.files[0],
                streams: 'dynamic',
                chunkSize: 'dynamic'
            }, false);

            upload.on('start', function () {
                template.currentUpload.set(this);
            });

            upload.on('end', function (error, fileObj) {
                if (error) {
                    alert('Error during upload: ' + error);
                } else {
                    // alert('File "' + fileObj.name + '" successfully uploaded');
                }
                template.currentUpload.set(false);
            });

            upload.start();
        }
    },

    "click #btnDelAttachment": function (evt, tmpl) {
        evt.preventDefault();
        console.log("Remove Attachment: "+this._id);
        Meteor.call("attachments.remove", this._id);
    }
});

Template.minutesAttachments.onCreated(function() {
    this.currentUpload = new ReactiveVar(false);
});

Template.minutesAttachments.onRendered(function() {
    //add your statement here
});

Template.minutesAttachments.onDestroyed(function() {
    //add your statement here
});

