import { MeetingSeries } from '../meetingseries';

let fs;
if (Meteor.isServer) {
    fs = require('fs-extra');   // trows an error on client
}

import { Meteor } from 'meteor/meteor';

import { FilesCollection } from 'meteor/ostrio:files';

export let AttachmentsCollection = new FilesCollection({
    collectionName: 'AttachmentsCollection',
    allowClientCode: false, // Disallow remove files from Client
    storagePath: function (fileObj) {
        let defaultpath = "/Users/wok/source/_js/4min_attachments/";
        if (Meteor.isServer) {
            if (fileObj && fileObj.meta && fileObj.meta.parentseries_id) {
                console.log("Upload attachment '"+fileObj.name +"' for meeting series " + fileObj.meta.parentseries_id);
                let path =  defaultpath + fileObj.meta.parentseries_id;
                // create dir if it does not exist
                fs.ensureDirSync(path);
                return path;
            } else {
                return defaultpath;
            }
        }
    }

    ,
    onBeforeUpload: function (file) {
        // Allow upload files under 10MB, and only in png/jpg/jpeg formats
        if (file.size <= 10485760*10000 && /png|jpg|jpeg|mpg|mpeg|mp4/i.test(file.extension)) {
            return true;
        } else {
            return 'Please upload image, with size equal or less than 10MB';
        }
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