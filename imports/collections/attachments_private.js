import { Meteor } from 'meteor/meteor';

import { FilesCollection } from 'meteor/ostrio:files';

export let AttachmentsCollection = new FilesCollection({
    collectionName: 'AttachmentsCollection',
    allowClientCode: false, // Disallow remove files from Client
    storagePath: "/Users/wok/source/_js/4min_attachments/",
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