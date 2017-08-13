import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import './idValidator';
import { InfoItemSchema } from './infoitem.schema';

const TopicsCollection = new Mongo.Collection('topics');

export const TopicSchema = SchemaClass.create({
    name: 'TopicSchema',
    collection: TopicsCollection,
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        parentId: {type: String, validators: [{type: 'meteorId'}], optional: true}, // todo: make this mandatory
        createdInMinute: {type: String, validators: [{type: 'meteorId'}]},
        subject: {type: String},
        responsibles: {type: [String], default: [], optional: true},
        isOpen: {type: Boolean, default: true},
        isRecurring: {type: Boolean, default: false},
        isNew: {type: Boolean, default: true},
        infoItems: {type: [InfoItemSchema], default: []},
        labels: {type: [String], validators: [{type: 'meteorId'}]},
        isSkipped: {type: Boolean, default: false }
    }
});

// todo: limit publish to specific series
if (Meteor.isServer) {
    Meteor.publish('topics', function () {
        return TopicSchema.find();
    });
}
// todo: subscribe directly in template
if (Meteor.isClient) {
    Meteor.subscribe('topics');
}