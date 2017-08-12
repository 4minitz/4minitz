import { Meteor } from 'meteor/meteor';

const fs = require('fs-extra');
const path = require('path');

createDocumentStoragePath = function (fileObj) { //eslint-disable-line
    if (Meteor.isServer) { 
        let absoluteDocumentPath = Meteor.settings.docGeneration && Meteor.settings.docGeneration.targetDocPath 
            ? Meteor.settings.docGeneration.targetDocPath 
            : 'protocols'; 
        // make path absolute 
        if (!path.isAbsolute(absoluteDocumentPath)) { 
            absoluteDocumentPath = path.resolve(absoluteDocumentPath); 
        } 
        // optionally: append sub directory for parent meeting series and year if a minute is given
        if (fileObj && fileObj.meta && fileObj.meta.minuteId) {
            absoluteDocumentPath =  absoluteDocumentPath + '/' + fileObj.meta.meetingSeriesId; 
            let minuteYear = new Date(fileObj.meta.minuteDate).getFullYear(); 
            absoluteDocumentPath =  absoluteDocumentPath + '/' + minuteYear;
        }
        // create target dir for attachment storage if it does not exist 
        fs.ensureDirSync(absoluteDocumentPath, function (err) { 
            if (err) { 
                console.error('ERROR: Could not create path for protocol storage: ' + absoluteDocumentPath); 
            } 
        }); 
        return absoluteDocumentPath; 
    }
};
// check storagePath for protocols once at server bootstrapping
if (Meteor.settings.docGeneration && Meteor.settings.docGeneration.enabled) {
    console.log('Document generation feature: ENABLED');
    let settingsPath = createDocumentStoragePath(undefined); //eslint-disable-line
    let absoluteTargetPath = path.resolve(settingsPath);
    console.log('Document Storage Path: ' + absoluteTargetPath);

    fs.access(absoluteTargetPath, fs.W_OK, function(err) {
        if(err){
            console.error('*** ERROR*** No write access to Document Storage Path');
            console.error('             Documents can not be saved.');
            console.error('             Ensure write access to path specified in your settings.json');
            console.error('             Current Document Storage Path setting is: ' + absoluteTargetPath);
            // Now switch off feature!
            Meteor.settings.docGeneration.enabled = false;
            console.log('Document generation feature: DISABLED');
        } else {
            console.log('OK, has write access to Document Storage Path');
        }
    });
} else {
    console.log('Document generation feature: DISABLED');
}