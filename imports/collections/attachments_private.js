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

if (Meteor.isClient) {
    Meteor.subscribe('files.attachments.all');
}

if (Meteor.isServer) {
    Meteor.publish('files.attachments.all', function () {
        return AttachmentsCollection.find().cursor;
    });
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