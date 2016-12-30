let fs;
let path;

if (Meteor.isServer) {
    fs = require('fs-extra');   // trows an error on client
    path = require('path');
}

import { Meteor } from 'meteor/meteor';

import { GlobalSettings } from '/imports/GlobalSettings'
import { UserRoles } from '../userroles'
import { MeetingSeries } from '../meetingseries';
import { Minutes } from '../minutes';
import { Attachment } from '../attachment';

import { FilesCollection } from 'meteor/ostrio:files';

// Security: html downloads from server might allow XSS
// see https://github.com/VeliovGroup/Meteor-Files/issues/289
const FORBIDDEN_FILENAME_EXTENSIONS = "html|htm|swf";
// const FORBIDDEN_FILENAME_EXTENSIONS = "swf";


export let calculateAndCreateStoragePath = function (fileObj) {
    if (Meteor.isServer) {
        let attStoragePath = Meteor.settings.attachments && Meteor.settings.attachments.storagePath
            ? Meteor.settings.attachments.storagePath   // always ends with slash - see GlobalSettings
            : "attachments/";

        // append sub directory for parent meeting series
        if (fileObj && fileObj.meta && fileObj.meta.parentseries_id) {
            attStoragePath =  attStoragePath + fileObj.meta.parentseries_id;
        }

        // create target dir for attachment storage if it does not exist
        fs.ensureDirSync(attStoragePath, function (err) {
            if (err) {
                console.error("ERROR: Could not create path for attachment upload: "+attStoragePath);
                if (!path.isAbsolute(attStoragePath)) {
                    console.error("absolute:"+path.resolve(attStoragePath));
                }
            }
        });
        return attStoragePath;
    }
};

export let AttachmentsCollection = new FilesCollection({
    collectionName: 'AttachmentsCollection',
    allowClientCode: false, // Disallow attachments remove() call from clients
    permissions: parseInt('0600', 8),      // Security: make uploaded files "chmod 600' only readable for server user
    storagePath: calculateAndCreateStoragePath,

    // Security: onBeforeUpload
    // Here we check for upload rights of user and if the file is within in defined limits
    // regarding file size and file extension. User must have upload role or better for meeting series.
    // This will be run in method context on client and(!) server by the Meteor-Files package
    // So, server will always perform the last ultimate check!
    onBeforeUpload: function (file) {
        if (! GlobalSettings.getAttachmentsEnabled()) {
            return "Upload not allowed in settings.json";
        }
        // Check if this upload candidate is allowed by size and extension
        // This method is called on client and on server
        if (! Meteor.userId()) {
            return "Upload not allowed. No user logged in.";
        }
        if (file.meta == undefined || file.meta.meetingminutes_id == undefined) {
            return "Upload not allowed. File has no target meeting series.";
        }
        // see if user has the uploader role - or better - for this meeting series
        let ur = new UserRoles();
        if (! ur.isUploaderFor(file.meta.parentseries_id)) {
            const msg = "Upload not allowed. User has no upload role for this meeting series.";
            console.log(msg);
            return msg;
        }
        // check if minutes is finalized
        let min = new Minutes(file.meta.meetingminutes_id);
        if (min.isFinalized) {
            const msg = "Upload not allowed. Minutes are finalized.";
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
            const fobiddenRE = new RegExp(FORBIDDEN_FILENAME_EXTENSIONS, "i");
            if (denyRE.test(file.extension) || fobiddenRE.test(file.extension)) {
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
        AttachmentsCollection.update(file._id, {$set: {"meta.timestamp": new Date()}});
    }
    ,

    // Security: downloadCallback
    // Here we check for download rights of user, which equals to the "invited" role - or better.
    // This will be run in method context on client and(!) server by the Meteor-Files package
    // So, server will always perform the last ultimate check!
    downloadCallback: function (file) {
        if (! this.userId) {
            console.log("Attachment download prohibited. User not logged in.");
            return false;
        }
        if (file.meta == undefined || file.meta.meetingminutes_id == undefined) {
            console.log("Attachment download prohibited. File without parent meeting series.");
            return false;
        }

        // see if user has the view role for this meeting series
        let ur = new UserRoles(this.userId);
        if (! ur.hasViewRoleFor(file.meta.parentseries_id)) {
            console.log("Attachment download prohibited. User has no view role for meeting series: "+file.meta.parentseries_id);
            return false;
        }

        return true;    // OK - Download allowed
    }
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

    export function bootstrapAttachementsLiveQuery() {
        // In case the user is invited to an existing meeting series
        // from her point of view a meeting series is added.
        // We re-subscribe to the attachments collection in this case,
        // to force that already existing attachments of this new
        // meeting series are sent from server to this client.
        // This live query lives happily til the end of the world...  ;-)
        let meetingSeriesLiveQuery = MeetingSeries.find();
        meetingSeriesLiveQuery.observe(
            {
                // "added" is for OTHER users, that are invited to existing meeting series
                "added": function () {
                    Meteor.subscribe('files.attachments.all');
                },
                // "changed" is for THIS user, while she creates a new meeting series for herself.
                // Such a series is first added (in client) and the "added" event above fires in the client
                // but at this time point the "visibleFor" field may not yet been set properly on the server.
                // So the server re-publish does not regard this meeting series as visible during
                // calculation of visible attachments.
                // So, we also register for the "changed" event to re-subscribe also when visibility changes
                // on the server side.
                "changed": function () {
                    Meteor.subscribe('files.attachments.all');
                }
            }
        );
    }
}


Meteor.methods({
    // Security: onBeforeRemove
    // Here we check for remove rights of user. User must have
    //   - either: moderator role for meeting series
    //   - or: uploader role for meeting series and this file was uploaded by user
    // This will be run in method server context.
    'attachments.remove'(attachmentID) {
        if (Meteor.isServer && attachmentID) {
            if (! this.userId) {
                console.log("Attachment removal prohibited. User not logged in.");
                return false;
            }
            let file = AttachmentsCollection.findOne(attachmentID);
            if (! file) {
                console.log("Attachment removal prohibited. Attachment not found in DB.");
                return false;
            }
            // we must ensure a known meeting minutes id, otherwise we can not check sufficient user role afterwards
            if (file.meta == undefined || file.meta.meetingminutes_id == undefined) {
                console.log("Attachment removal prohibited. File without meetingminutes_id.");
                return false;
            }

            const att = new Attachment(attachmentID);
            // mayRemove() checks for not-finalized minutes and sufficient user role
            if (! att.mayRemove() ) {
                console.log("Attachment removal prohibited. User has no sufficient role for meeting series: "+file.meta.parentseries_id);
                return false;
            }

            AttachmentsCollection.remove({_id: attachmentID}, function (error) {
                if (error) {
                    console.error("File "+ attachmentID + " wasn't removed, error: " + error.reason)
                } else {
                    console.info("File "+ attachmentID + " successfully removed");
                }
            });
        }
    }
});



// check storagePath for attachments once at bootstrapping
if (Meteor.isServer) {
    if (Meteor.settings.attachments && Meteor.settings.attachments.enabled) {
        console.log("Attachments upload feature: ENABLED");
        let settingsPath = calculateAndCreateStoragePath(null);
        let absoluteTargetPath = path.resolve(settingsPath);
        console.log("attachmentsStoragePath:"+absoluteTargetPath);

        fs.access(absoluteTargetPath, fs.W_OK, function(err) {
            if(err){
                console.error("*** ERROR*** No write access to attachmentsStoragePath");
                console.error("             Uploads can not be saved.");
                console.error("             Ensure write access to path specified in your settings.json");
                console.error("             Current attachments.storagePath setting is: "+settingsPath);
                if (! path.isAbsolute(settingsPath)) {
                    console.error("             Which maps to: "+absoluteTargetPath);
                }
                // Now switch off feature!
                Meteor.settings.attachments.enabled = false;
                console.log("Attachments upload feature: DISABLED");
            } else {
                console.log("OK, has write access to attachmentsStoragePath");
            }
        });
    } else {
        console.log("Attachments upload feature: DISABLED");
    }
}
