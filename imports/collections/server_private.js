import { Mongo } from 'meteor/mongo'

// Here we will store server key/value pairs.
// e.g. unique installation ID
export const ServerCollection = new Mongo.Collection('server');

// Here we will store performed updated checks on the update check master
export const UpdateChecksCollection = new Mongo.Collection('updatechecks');
