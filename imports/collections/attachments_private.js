let fs;
if (Meteor.isServer) {
    fs = require('fs-extra');   // trows an error on client
}

import { Meteor } from 'meteor/meteor';

import { GlobalSettings } from '/imports/GlobalSettings'
import { UserRoles } from '../userroles'
import { MeetingSeries } from '../meetingseries';

import { FilesCollection } from 'meteor/ostrio:files';

export let AttachmentsCollection = new FilesCollection({
    collectionName: 'AttachmentsCollection',
    allowClientCode: false, // Disallow remove files from Client
    permissions: parseInt('0600', 8),      // Security: make uploaded files "chmod 600' only readable for server user
    storagePath: function (fileObj) {
        if (Meteor.isServer) {
            let defaultpath = Meteor.settings.attachments.storagePath;
            if (fileObj && fileObj.meta && fileObj.meta.parentseries_id) {
                let path =  defaultpath + fileObj.meta.parentseries_id;
                // create dir if it does not exist
                fs.ensureDirSync(path);
                return path;
            } else {
                return defaultpath;
            }
        }
    },

    // onBeforeUpload
    // Here we check for upload rights of user and if the file is in defined limits
    // regarding file size and file extension.
    // Security: this will be run in method context on client and(!) server
    // So, server will always perform the last ultimate check!
    onBeforeUpload: function (file) {
        // Check if this upload candidate is allowed by size and extension
        // This method is called on client and on server
        if (! Meteor.userId()) {
            return "Upload not allowed. No user logged in.";
        }
        if (file.meta == undefined || file.meta.meetingminutes_id == undefined) {
            return "Upload not allowed. File has no target meeting series.";
        }
        // see if user has the uploader role for this meeting series
        let ur = new UserRoles();
        if (! ur.isUploaderFor(file.meta.parentseries_id)) {
            const msg = "Upload not allowed. User has no upload role for this meeting series.";
            console.log(msg);
            return msg;
        }
        // Check for allowed file size
        if (file.size > Meteor.settings.public.attachments.maxFileSize) {
            const maxMB = Math.floor(Meteor.settings.public.attachments.maxFileSize / 1024 / 1024);
            return "Please upload file with max. " + maxMB + " MB.";
        }
        // Check for non-allowed file extensions
        if (Meteor.settings.public.attachments.denyExtensions != undefined) {
            const denyRE = new RegExp(Meteor.settings.public.attachments.denyExtensions, "i");
            if (denyRE.test(file.extension)) {
                return "Denied file extension. Please upload other file type.";
            }
        }
        // If allowExtensions is undefined, every extension is allowed!
        if (Meteor.settings.public.attachments.allowExtensions == undefined) {
            return true;
        }
        // Check for allowed file extensions
        const allowRE = new RegExp(Meteor.settings.public.attachments.allowExtensions, "i");
        if (allowRE.test(file.extension)) {
            return true;
        }

        // console.log("Upload attachment '"+fileObj.name +"' for meeting series " + fileObj.meta.parentseries_id);

        return "Non-allowed file extension. Please upload file type of:<br>"
            + Meteor.settings.public.attachments.allowExtensions;
    },

    onAfterUpload: function (file) {
        console.log("Successfully uploaded attachment file: "+file.name + " to "+file.path);
    }
    ,

    // downloadCallback
    // Here we check for download rights of user.
    // Security: this will be run in method context on client and(!) server
    // So, server will always perform the last ultimate check!
    downloadCallback: function (file) {
        if (! this.userId) {
            console.log("Attachment download prohibited. User not logged in.");
            return false;
        }
        console.log("OK - logged in");
        if (file.meta == undefined || file.meta.meetingminutes_id == undefined) {
            console.log("Attachment download prohibited. File without parent meeting series.");
            return false;
        }
        console.log("OK - file has Metadata");

        // see if user has the uploader role for this meeting series
        let ur = new UserRoles(this.userId);
        if (! ur.hasViewRoleFor(file.meta.parentseries_id)) {
            console.log("Attachment download prohibited. User has no view role for meeting series: "+file.meta.parentseries_id);
            return false;
        }
        console.log("OK - view Role");

        return true;    // OK - Download allowed
    }
    // ,
    //
    // onBeforeRemove: function (file) {
    //     return false;
    // }
});


if (Meteor.isServer) {
    Meteor.publish('files.attachments.all', function () {
        // We publish only those attachments that are bound to
        // a meeting series that is visible for the current user
        let meetingSeriesIDs = MeetingSeries.getAllVisibleIDsForUser(this.userId);
        return AttachmentsCollection.find(
            {"meta.parentseries_id": {$in: meetingSeriesIDs}}
        ).cursor;
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('files.attachments.all');

    // In case the user is invited to an existing meeting series
    // from her point of view a meeting series is added.
    // We re-subscribe to the attachments collection in this case,
    // to force that already existing attachments of this new
    // meeting series are sent from server to this client.
    // This live query lives happily til the end of the world...  ;-)
    let meetingSeriesLiveQuery = MeetingSeries.find();
    meetingSeriesLiveQuery.observe(
        {
            "added": function () {
                Meteor.subscribe('files.attachments.all');
            }
        }
    );
}


Meteor.methods({
    'attachments.remove'(id) {
        if (Meteor.isServer && id) {
            AttachmentsCollection.remove(id, function (err) {
                console.log("Error on remove:");
                console.log(err);
            });
        }
    }
});