
// The /server/lib ensures, that all global functions from here are loaded first
// So any server code can rely on availability of these attachment helper methods
// We had to move them outside of /import dir to ensure this code is never available
// on the client. Because previously fs-extra stuff was inserted into client code
// and broke loading the app in IE11

import { Meteor } from 'meteor/meteor';

const fs = require('fs-extra');
const path = require('path');

calculateAndCreateStoragePath = function (fileObj) { //eslint-disable-line
    if (Meteor.isServer) {
        let absAttachmentStoragePath = Meteor.settings.attachments && Meteor.settings.attachments.storagePath
            ? Meteor.settings.attachments.storagePath
            : 'attachments';
        // make path absolute
        if (!path.isAbsolute(absAttachmentStoragePath)) {
            absAttachmentStoragePath = path.resolve(absAttachmentStoragePath);
        }
        // optionally: append sub directory for parent meeting series
        if (fileObj && fileObj.meta && fileObj.meta.parentseries_id) {
            absAttachmentStoragePath =  absAttachmentStoragePath + '/' + fileObj.meta.parentseries_id;
        }

        // create target dir for attachment storage if it does not exist
        fs.ensureDirSync(absAttachmentStoragePath, function (err) {
            if (err) {
                console.error('ERROR: Could not create path for attachment upload: '+absAttachmentStoragePath);
            }
        });
        return absAttachmentStoragePath;
    }
};


removeMeetingSeriesAttachmentDir = function (meetingseries_id) { //eslint-disable-line
    if (meetingseries_id.length > 0) {  // ensure "attachment root" is not deleted
        let storagePath = calculateAndCreateStoragePath(); //eslint-disable-line
        storagePath += '/'+meetingseries_id;
        fs.remove(storagePath, function (err) {
            if (err) {
                console.error('Could not remove attachment dir:'+storagePath+' of meeting series with ID:'+meetingseries_id);
            }
        });
    }
};


// check storagePath for attachments once at server bootstrapping
if (Meteor.settings.attachments && Meteor.settings.attachments.enabled) {
    console.log('Attachments upload feature: ENABLED');
    let settingsPath = calculateAndCreateStoragePath(null); //eslint-disable-line
    let absoluteTargetPath = path.resolve(settingsPath);
    console.log('attachmentsStoragePath:'+absoluteTargetPath);

    fs.access(absoluteTargetPath, fs.W_OK, function(err) {
        if(err){
            console.error('*** ERROR*** No write access to attachmentsStoragePath');
            console.error('             Uploads can not be saved.');
            console.error('             Ensure write access to path specified in your settings.json');
            console.error('             Current attachments.storagePath setting is: '+settingsPath);
            if (! path.isAbsolute(settingsPath)) {
                console.error('             Which maps to: '+absoluteTargetPath);
            }
            // Now switch off feature!
            Meteor.settings.attachments.enabled = false;
            console.log('Attachments upload feature: DISABLED');
        } else {
            console.log('OK, has write access to attachmentsStoragePath');
        }
    });
} else {
    console.log('Attachments upload feature: DISABLED');
}
